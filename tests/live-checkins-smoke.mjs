import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:3100';
const api = 'http://127.0.0.1:4100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Africa/Lagos', acceptDownloads: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const png = Buffer.from('89504e470d0a1a0a123456789abcdef0', 'hex');

async function visit(path) {
  const response = await page.goto(base + path);
  assert.ok(response?.ok(), 'Unable to open ' + path);
}

async function login(role) {
  await visit('/login');
  await page.locator('input[name="email"]').fill(role + '@guestly.test');
  await page.locator('input[name="password"]').fill('TestPassword123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, '') === '/' + role);
}

async function logout() {
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, '') === '/login');
}

function stay(offset) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = kind => parts.find(part => part.type === kind).value;
  const start = new Date(value('year') + '-' + value('month') + '-' + value('day') + 'T12:00:00Z');
  start.setUTCDate(start.getUTCDate() + offset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);
  return { checkIn: start.toISOString().slice(0, 10), checkOut: end.toISOString().slice(0, 10) };
}

async function apiRequest(path, data) {
  const token = await page.evaluate(() => sessionStorage.getItem('guestly.api.session.v1'));
  const response = await fetch(api + path, {
    method: data ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, ...(data ? { 'Content-Type': 'application/json' } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const result = await response.json();
  assert.ok(response.ok && result.success, 'API failure: ' + path + ': ' + result.message);
  return result.data;
}

async function createConfirmedBooking() {
  const input = { ...stay(7), guests: 2, roomId: 'standard-cozy-haven', requestId: crypto.randomUUID() };
  const held = await apiRequest('/api/v1/bookings', input);
  assert.equal(held.status, 'pending');
  const payment = await apiRequest('/api/v1/payments/initialize', { bookingId: held.id });
  const settled = await fetch(api + '/__test/pay', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference: payment.reference }),
  });
  assert.ok(settled.ok);
  const result = await apiRequest('/api/v1/bookings/' + held.id);
  assert.equal(result.status, 'confirmed');
  return result;
}

async function attachID() {
  await page.locator('input[type="file"][name="document"]').setInputFiles({ name: 'guest-id.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('button', { name: /Submit for review|Resubmit for review/ }).click();
  await page.getByRole('heading', { name: 'Your details are under review' }).waitFor();
}

try {
  await login('guest');
  const booking = await createConfirmedBooking();
  await visit('/guest/access');
  await page.getByRole('heading', { name: 'No approved check-in yet' }).waitFor();
  await visit('/guest/check-in?booking=' + booking.id);
  await page.getByRole('heading', { name: 'Digital check-in' }).waitFor();
  await attachID();
  const first = await apiRequest('/api/v1/checkins/me');
  assert.equal(first.items[0].status, 'pending');
  assert.equal(first.items[0].documentEncrypted, undefined);
  await logout();

  await login('staff');
  await visit('/staff/check-ins?view=pending');
  await page.getByRole('heading', { name: 'Check-in queue' }).waitFor();
  await page.getByText(booking.id).first().waitFor();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download ID securely' }).click(),
  ]);
  assert.match(download.suggestedFilename(), /identity-document/);
  await page.getByRole('button', { name: 'Reject', exact: true }).waitFor();
  await page.getByRole('textbox', { name: /Review note/ }).fill('Please upload a clearer image');
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.getByText('Rejected').first().waitFor();
  await logout();

  await login('guest');
  await visit('/guest/check-in?booking=' + booking.id);
  await page.getByText('Please upload a clearer image').waitFor();
  await attachID();
  await logout();

  await login('staff');
  await visit('/staff/check-ins');
  await page.getByRole('button', { name: 'Approve check-in' }).click();
  await page.getByText('Approved').first().waitFor();
  await logout();

  await login('guest');
  await visit('/guest/access');
  await page.getByText('This is a simulation.').waitFor();
  await page.getByText('Scheduled').waitFor();
  assert.equal(await page.getByText(/^SIM-/).count(), 0);
  const during = booking.checkIn + 'T15:00:00+01:00';
  let response = await fetch(api + '/__test/checkin-clock', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ at: during }),
  });
  assert.ok(response.ok);
  await page.reload();
  await page.getByText(/^SIM-/).waitFor();
  await page.getByText('Active simulation').waitFor();
  response = await fetch(api + '/__test/checkin-clock', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ at: booking.checkOut + 'T13:00:00+01:00' }),
  });
  assert.ok(response.ok);
  await page.reload();
  await page.getByText('Expired').waitFor();
  assert.equal(await page.getByText(/^SIM-/).count(), 0);
  assert.deepEqual(errors, []);
  process.stdout.write('Live secure check-in, staff review and simulation browser checks passed\n');
} finally {
  await browser.close();
}

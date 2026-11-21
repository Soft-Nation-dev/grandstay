import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:3100';
const api = 'http://127.0.0.1:4100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Africa/Lagos' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

function hotelDate(offset = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = kind => parts.find(part => part.type === kind).value;
  const day = new Date(value('year') + '-' + value('month') + '-' + value('day') + 'T12:00:00Z');
  day.setUTCDate(day.getUTCDate() + offset);
  return day.toISOString().slice(0, 10);
}

async function visit(path) {
  const result = await page.goto(base + path);
  assert.ok(result?.ok(), 'Could not open ' + path);
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

async function apiCall(path, body, expected = 200) {
  const token = await page.evaluate(() => sessionStorage.getItem('guestly.api.session.v1'));
  const response = await fetch(api + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: 'Bearer ' + token, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert.equal(response.status, expected, 'Unexpected status from ' + path);
  return response.json();
}

async function createActiveBooking() {
  const hold = await apiCall('/api/v1/bookings', {
    roomId: 'standard-cozy-haven', checkIn: hotelDate(), checkOut: hotelDate(1),
    guests: 2, requestId: randomUUID(),
  }, 201);
  assert.equal(hold.data.status, 'pending');
  const payment = await apiCall('/api/v1/payments/initialize', { bookingId: hold.data.id });
  const settlement = await fetch(api + '/__test/pay', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference: payment.data.reference }),
  });
  assert.ok(settlement.ok);
  const confirmed = await apiCall('/api/v1/bookings/' + hold.data.id);
  assert.equal(confirmed.data.status, 'confirmed');
  return hold.data.id;
}

try {
  await login('guest');
  const bookingId = await createActiveBooking();

  const denied = await apiCall('/api/v1/servicerequests', undefined, 403);
  assert.equal(denied.success, false);
  const staffInbox = await apiCall('/api/v1/concierge/conversations', undefined, 403);
  assert.equal(staffInbox.success, false);

  await visit('/guest/bookings');
  await page.getByRole('button', { name: 'Refresh records' }).click();
  await page.getByText(bookingId).first().waitFor();

  await visit('/guest/services');
  await page.getByRole('heading', { name: 'Hotel services' }).waitFor();
  await page.getByRole('combobox', { name: 'Service category' }).selectOption({ label: 'Housekeeping' });
  await page.getByRole('textbox', { name: /Request details/ }).fill('Please clean the room and bring towels.');
  await page.getByRole('button', { name: 'Submit request' }).click();
  await page.getByText('Request received. Hotel staff will update its progress.').waitFor();
  const own = await apiCall('/api/v1/servicerequests/me');
  assert.equal(own.data.items[0].status, 'received');
  assert.equal(own.data.items[0].bookingId, bookingId);
  assert.equal(own.data.items[0].history.length, 1);

  await visit('/guest/concierge');
  await page.getByRole('heading', { name: 'Concierge' }).waitFor();
  await page.getByRole('textbox', { name: 'Message' }).fill('Hello, is housekeeping available today?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('Hello, is housekeeping available today?').waitFor();
  const ownChat = await apiCall('/api/v1/concierge/me');
  assert.equal(ownChat.data.items[0].sender, 'guest');
  const guestId = ownChat.data.items[0].guestId;

  await logout();
  await login('staff');
  await visit('/staff/services');
  await page.getByRole('heading', { name: 'Service requests' }).waitFor();
  await page.getByText('Please clean the room and bring towels.').waitFor();
  await page.getByRole('button', { name: 'Mark in progress' }).click();
  await page.getByRole('button', { name: 'Mark done' }).waitFor();
  await page.getByRole('button', { name: 'Mark done' }).click();
  await page.getByText('Done').first().waitFor();
  const staffRequests = await apiCall('/api/v1/servicerequests');
  assert.equal(staffRequests.data.items[0].status, 'done');
  assert.deepEqual(staffRequests.data.items[0].history.map(item => item.status), ['received', 'in-progress', 'done']);

  await visit('/staff/concierge?view=waiting');
  await page.getByRole('heading', { name: 'Concierge inbox' }).waitFor();
  await page.getByText('Alex Morgan').first().waitFor();
  await page.getByRole('textbox', { name: 'Message' }).fill('Yes, we can assist. Housekeeping is on the way.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('Yes, we can assist. Housekeeping is on the way.').waitFor();
  const inbox = await apiCall('/api/v1/concierge/conversations');
  assert.equal(inbox.data.items[0].waiting, false);

  await logout();
  await login('manager');
  await visit('/manager/services');
  await page.getByRole('heading', { name: 'Services & performance' }).waitFor();
  await page.getByRole('button', { name: /Add service/ }).click();
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save service' }) });
  await form.locator('input[name="name"]').fill('Spa Assistance');
  await form.locator('textarea[name="description"]').fill('Arrange appointments with our hotel spa.');
  await form.getByRole('button', { name: 'Save service' }).click();
  await page.getByRole('heading', { name: 'Spa Assistance' }).waitFor();
  await page.getByText('3/3 done').count();
  const catalogue = await apiCall('/api/v1/servicerequests/catalogue/manage');
  assert.ok(catalogue.data.some(item => item.name === 'Spa Assistance'));

  await logout();
  await login('guest');
  await visit('/guest/services');
  await page.getByText('Please clean the room and bring towels.').waitFor();
  await page.getByText('Done').first().waitFor();
  await visit('/guest/concierge');
  await page.getByText('Yes, we can assist. Housekeeping is on the way.').waitFor();
  const messages = await apiCall('/api/v1/concierge/me');
  assert.equal(messages.data.items.at(-1).sender, 'staff');
  assert.equal(messages.data.items.at(-1).guestId, guestId);

  const fit = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  assert.ok(fit.scroll <= fit.viewport + 2, 'Mobile horizontal overflow detected');
  assert.deepEqual(errors, []);
  process.stdout.write('Live guest services, staff workflow, manager catalogue and human concierge browser checks passed\n');
} finally {
  await browser.close();
}

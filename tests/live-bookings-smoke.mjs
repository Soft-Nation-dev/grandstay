import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, timezoneId: 'Africa/Lagos' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('https://checkout.paystack.com/**', async route => {
  await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><title>Paystack test</title><body><h1>Paystack checkout test</h1></body></html>' });
});

function stay(offset) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date());
  const date = type => today.find(part => part.type === type).value;
  const start = new Date(date('year') + '-' + date('month') + '-' + date('day') + 'T12:00:00Z');
  start.setUTCDate(start.getUTCDate() + offset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);
  return { checkIn: start.toISOString().slice(0, 10), checkOut: end.toISOString().slice(0, 10) };
}

async function visit(path) {
  const response = await page.goto(base + path);
  assert.ok(response?.ok(), 'Page failed: ' + path);
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

async function startPayment(offset) {
  const query = new URLSearchParams({ ...stay(offset), guests: '2' });
  await visit('/rooms?' + query);
  await page.getByRole('heading', { name: 'Standard Cozy Haven' }).waitFor();
  await page.getByRole('link', { name: /View room/ }).first().click();
  await page.getByRole('link', { name: /Reserve room/ }).click();
  await page.getByRole('heading', { name: 'Complete your booking' }).waitFor();
  await page.getByRole('button', { name: /Reserve and continue to Paystack/ }).click();
  await page.waitForURL(url => url.hostname === 'checkout.paystack.com');
  await page.getByRole('heading', { name: 'Paystack checkout test' }).waitFor();
  const reference = new URL(page.url()).searchParams.get('reference');
  assert.ok(reference, 'Paystack redirect missing transaction reference');
  return reference;
}

async function settle(reference) {
  const response = await fetch('http://127.0.0.1:4100/__test/pay', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });
  assert.ok(response.ok, 'Could not simulate provider settlement');
}

try {
  await login('guest');
  const reference = await startPayment(5);
  await settle(reference);
  await visit('/payment/return?reference=' + encodeURIComponent(reference));
  await page.getByRole('heading', { name: 'Booking confirmed' }).waitFor();
  await page.getByText('verified by Paystack').waitFor();
  await visit('/guest/bookings');
  await page.getByText('Verified payment').waitFor();
  assert.equal(await page.getByText('Paid (test)').count(), 0);

  const secondReference = await startPayment(15);
  await visit('/guest/bookings');
  const pending = page.locator('.booking-card').filter({ hasText: secondReference });
  await pending.getByRole('button', { name: 'Cancel hold' }).click();
  await pending.getByText('Cancelled').waitFor();
  await settle(secondReference);
  await visit('/payment/return?reference=' + encodeURIComponent(secondReference));
  await page.getByRole('heading', { name: 'Payment needs attention' }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Booking confirmed' }).count(), 0);

  await visit('/guest/bookings');
  await logout();
  await login('staff');
  await visit('/staff/bookings');
  await page.getByRole('heading', { name: 'Hotel bookings' }).waitFor();
  await page.getByText(reference).first().waitFor();
  await logout();

  await login('manager');
  await visit('/manager/bookings');
  await page.getByRole('heading', { name: 'Paystack reconciliation' }).waitFor();
  await page.getByText(secondReference).last().waitFor();
  await page.getByRole('button', { name: 'Request full refund' }).click();
  await page.getByText('Refund requested. Check Paystack').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Request full refund' }).count(), 0);

  assert.deepEqual(errors, []);
  process.stdout.write('Live reservation, Paystack callback and refund browser checks passed\n');
} finally {
  await browser.close();
}

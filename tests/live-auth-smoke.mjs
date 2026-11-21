import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:3100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function visit(path) {
  const response = await page.goto(base + path);
  assert.ok(response?.ok(), 'Failed to load ' + path);
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

try {
  await visit('/login');
  assert.equal(await page.getByText('Preview accounts').count(), 0);

  await login('guest');
  await page.getByRole('heading', { name: 'Welcome, Alex.' }).waitFor();
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByLabel('First name').fill('Avery');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('heading', { name: 'Welcome, Avery.' }).waitFor();
  await visit('/admin');
  await page.getByRole('heading', { name: 'Access restricted' }).waitFor();
  await visit('/guest');
  await logout();

  await visit('/register');
  await page.locator('input[name="name"]').fill('Nneka Obi');
  await page.locator('input[name="email"]').fill('nneka@guestly.test');
  await page.locator('input[name="password"]').fill('TestPassword123');
  await page.locator('input[name="confirmPassword"]').fill('TestPassword123');
  await page.getByRole('button', { name: 'Create guest account' }).click();
  await page.waitForURL(url => url.pathname.replace(/\/$/, '') === '/guest');
  await page.getByRole('heading', { name: 'Welcome, Nneka.' }).waitFor();
  await logout();

  await login('staff');
  await page.getByRole('heading', { name: 'Welcome, Amina.' }).waitFor();
  await logout();

  await login('manager');
  await page.getByRole('heading', { name: 'Welcome, Tunde.' }).waitFor();
  await logout();

  await login('admin');
  await page.getByRole('heading', { name: 'Team access management' }).waitFor();
  await page.getByText('Staff & managers', { exact: true }).waitFor();
  const form = page.locator('.team-panel form').first();
  await form.locator('input[name="name"]').fill('New Staff Member');
  await form.locator('input[name="email"]').fill('new.staff@guestly.test');
  await form.locator('input[name="password"]').fill('TestPassword123');
  await form.getByRole('button', { name: 'Create account' }).click();
  await page.getByText('Staff account created for New Staff Member.').waitFor();
  const entry = page.locator('.admin-account').filter({ hasText: 'new.staff@guestly.test' });
  await entry.getByRole('button', { name: 'Manage' }).click();
  await entry.locator('select').nth(0).selectOption('manager');
  await entry.locator('select').nth(1).selectOption('inactive');
  await entry.getByRole('button', { name: 'Save changes' }).click();
  await entry.getByText('Inactive', { exact: true }).waitFor();

  const revoke = await fetch('http://127.0.0.1:4100/__test/revoke', {
    method: 'POST', headers: { 'X-Email': 'admin@guestly.test' },
  });
  assert.ok(revoke.ok());
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('heading', { name: 'Sign in to continue' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Sign in to continue' }).waitFor();
  assert.deepEqual(errors, []);
  process.stdout.write('Live-mode authentication browser checks passed\n');
} finally {
  await browser.close();
}

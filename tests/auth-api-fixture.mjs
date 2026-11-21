import http from 'node:http';
import { randomUUID } from 'node:crypto';

const users = new Map();
const sessions = new Map();
const revoked = new Set();
const sharedPassword = 'TestPassword123';

function addUser(firstName, lastName, email, role, password = sharedPassword) {
  const user = {
    id: randomUUID().replaceAll('-', '').slice(0, 24),
    firstName, lastName, email, role, isActive: true, phone: '',
    password,
  };
  users.set(email, user);
  return user;
}

addUser('Alex', 'Morgan', 'guest@guestly.test', 'guest');
addUser('Amina', 'Bello', 'staff@guestly.test', 'staff');
addUser('Tunde', 'Adeyemi', 'manager@guestly.test', 'manager');
addUser('Guestly', 'Admin', 'admin@guestly.test', 'admin');

function publicUser(user) {
  const { password, ...profile } = user;
  return profile;
}

function json(res, status, success, message, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success, message, ...(data === undefined ? {} : { data }) }));
}

function session(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token || revoked.has(token)) return null;
  const email = sessions.get(token);
  const user = users.get(email);
  return user?.isActive ? { token, user } : null;
}

function requestBody(req) {
  return new Promise((resolve, reject) => {
    let value = '';
    req.on('data', part => { value += part; if (value.length > 100000) reject(new Error('Body too large')); });
    req.on('end', () => {
      try { resolve(value ? JSON.parse(value) : {}); }
      catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3100');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Email');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url || '/', 'http://127.0.0.1:4100');
  try {
    if (url.pathname === '/api/v1/auth/register' && req.method === 'POST') {
      const data = await requestBody(req);
      if (users.has(data.email)) return json(res, 409, false, 'Email is already registered');
      if (data.password !== data.confirmPassword) return json(res, 400, false, 'Passwords do not match');
      const user = addUser(data.firstName, data.lastName, data.email, 'guest', data.password);
      return json(res, 201, true, 'Account created successfully', publicUser(user));
    }
    if (url.pathname === '/api/v1/auth/login' && req.method === 'POST') {
      const data = await requestBody(req);
      const user = users.get(data.email);
      if (!user || user.password !== data.password) return json(res, 401, false, 'Invalid email or password');
      if (!user.isActive) return json(res, 403, false, 'Your account is inactive');
      const token = randomUUID();
      sessions.set(token, user.email);
      return json(res, 200, true, 'Login successful', { token, user: publicUser(user) });
    }
    if (url.pathname === '/__test/revoke' && req.method === 'POST') {
      for (const [token, email] of sessions) {
        if (email === req.headers['x-email']) revoked.add(token);
      }
      return json(res, 200, true, 'Revoked');
    }
    const active = session(req);
    if (!active) return json(res, 401, false, 'Invalid or expired session');
    if (url.pathname === '/api/v1/auth/me' && req.method === 'GET') {
      return json(res, 200, true, 'Profile retrieved', publicUser(active.user));
    }
    if (url.pathname === '/api/v1/auth/me' && req.method === 'PATCH') {
      const data = await requestBody(req);
      for (const field of ['firstName', 'lastName', 'phone']) {
        if (typeof data[field] === 'string') active.user[field] = data[field];
      }
      return json(res, 200, true, 'Profile updated', publicUser(active.user));
    }
    if (url.pathname === '/api/v1/auth/logout' && req.method === 'POST') {
      revoked.add(active.token);
      return json(res, 200, true, 'Signed out');
    }
    if (active.user.role !== 'admin') return json(res, 403, false, 'Access denied');
    if (url.pathname === '/api/v1/users/team' && req.method === 'GET') {
      return json(res, 200, true, 'Team retrieved', [...users.values()].filter(u => ['staff', 'manager'].includes(u.role)).map(publicUser));
    }
    if (url.pathname === '/api/v1/users/team' && req.method === 'POST') {
      const data = await requestBody(req);
      if (!['staff', 'manager'].includes(data.role)) return json(res, 400, false, 'Invalid role');
      const user = addUser(data.firstName, data.lastName, data.email, data.role, data.password);
      return json(res, 201, true, 'Team created', publicUser(user));
    }
    const match = url.pathname.match(/^\/api\/v1\/users\/team\/([a-f0-9]{24})\/access$/);
    if (match && req.method === 'PATCH') {
      const user = [...users.values()].find(u => u.id === match[1] && ['staff', 'manager'].includes(u.role));
      if (!user) return json(res, 404, false, 'Team account not found');
      const data = await requestBody(req);
      user.role = data.role;
      user.isActive = data.isActive;
      for (const [token, email] of sessions) {
        if (email === user.email) revoked.add(token);
      }
      return json(res, 200, true, 'Team updated', publicUser(user));
    }
    return json(res, 404, false, 'Not found');
  } catch {
    return json(res, 500, false, 'Request failed');
  }
});

server.listen(4100, '127.0.0.1');

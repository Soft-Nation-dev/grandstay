import http from 'node:http';
import { randomUUID } from 'node:crypto';

const users = new Map();
const sessions = new Map();
const revoked = new Set();
const sharedPassword = 'TestPassword123';
const bookings = [];
const payments = [];
const audit = [];

function pageItems(items, url) {
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 30);
  return { items: items.slice((page - 1) * limit, page * limit), page, limit, total: items.length };
}

function record(action, bookingId, paymentId) {
  audit.unshift({
    id: randomUUID().slice(0, 24), action, bookingId: bookingId || null,
    paymentId: paymentId || null, createdAt: new Date().toISOString(),
  });
}

function bookingForPayment(reference) {
  const payment = payments.find(item => item.reference === reference);
  return { payment, booking: bookings.find(item => item.id === payment?.bookingId) };
}
let hotel = {
  id: 'primary', name: 'Guestly', tagline: 'Your comfort, our priority.',
  description: 'A more thoughtful stay, from the moment you book to the moment you leave.',
  location: 'Lagos, Nigeria', currency: 'NGN', heroImage: '/images/deluxe-executive-suite.jpg',
};
const rooms = [
  {
    id: 'standard-cozy-haven', name: 'Standard Cozy Haven', category: 'Standard',
    image: '/images/standard-cozy-haven.jpg', nightlyRate: 55000, capacity: 2,
    size: 34, bed: 'Queen bed', view: 'City view', amenities: ['Wi-Fi'],
    description: 'A welcoming room', inventory: 3, featured: true,
  },
  {
    id: 'deluxe-executive-suite', name: 'Deluxe Executive Suite', category: 'Executive',
    image: '/images/deluxe-executive-suite.jpg', nightlyRate: 85000, capacity: 2,
    size: 62, bed: 'King bed', view: 'City view', amenities: ['High-speed Wi-Fi'],
    description: 'Room with a view', inventory: 2, featured: true,
  },
];

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
    if (url.pathname === '/api/v1/hotels/current' && req.method === 'GET') {
      return json(res, 200, true, 'Hotel retrieved', hotel);
    }
    if (url.pathname === '/api/v1/rooms' && req.method === 'GET') {
      return json(res, 200, true, 'Rooms retrieved', rooms);
    }
    if (url.pathname === '/api/v1/rooms/availability' && req.method === 'GET') {
      const guests = Number(url.searchParams.get('guests'));
      const available = rooms.filter(room => room.capacity >= guests && room.inventory > 0)
        .map(room => {
          const held = bookings.filter(item => item.roomId === room.id && ['pending', 'confirmed'].includes(item.status) &&
            item.checkIn < url.searchParams.get('checkOut') && item.checkOut > url.searchParams.get('checkIn')).length;
          return { ...room, availableInventory: Math.max(0, room.inventory - 1 - held) };
        })
        .filter(room => room.availableInventory > 0);
      return json(res, 200, true, 'Availability retrieved', available);
    }
    if (url.pathname === '/__test/pay' && req.method === 'POST') {
      const data = await requestBody(req);
      const { payment, booking } = bookingForPayment(data.reference);
      if (!payment || !booking) return json(res, 404, false, 'Missing payment');
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
        payment.status = 'success';
        record('payment.succeeded', booking.id, payment.id);
        record('booking.confirmed', booking.id, payment.id);
      } else {
        payment.status = 'refund_required';
        record('payment.refund_required', booking.id, payment.id);
      }
      payment.paidAt = new Date().toISOString();
      return json(res, 200, true, 'Payment verified', { reference: payment.reference, status: payment.status });
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
    if (url.pathname === '/api/v1/hotels/current' && req.method === 'PATCH') {
      if (active.user.role !== 'manager') return json(res, 403, false, 'Access denied');
      const fields = await requestBody(req);
      hotel = { ...hotel, ...fields };
      return json(res, 200, true, 'Hotel updated', hotel);
    }
    if (url.pathname === '/api/v1/rooms' && req.method === 'POST') {
      if (active.user.role !== 'manager') return json(res, 403, false, 'Access denied');
      const fields = await requestBody(req);
      const room = { ...fields, id: fields.name.toLowerCase().replaceAll(/\s+/g, '-') + '-new' };
      rooms.push(room);
      return json(res, 201, true, 'Room created', room);
    }
    const roomMatch = url.pathname.match(/^\/api\/v1\/rooms\/([a-z0-9-]+)$/);
    if (roomMatch && req.method === 'PATCH') {
      if (active.user.role !== 'manager') return json(res, 403, false, 'Access denied');
      const room = rooms.find(item => item.id === roomMatch[1]);
      if (!room) return json(res, 404, false, 'Room type not found');
      Object.assign(room, await requestBody(req));
      return json(res, 200, true, 'Room updated', room);
    }
    if (url.pathname === '/api/v1/bookings' && req.method === 'POST') {
      if (active.user.role !== 'guest') return json(res, 403, false, 'Access denied');
      const data = await requestBody(req);
      if (data.totalAmount || data.status) return json(res, 400, false, 'Invalid booking fields');
      const old = bookings.find(item => item.guestId === active.user.id && item.requestId === data.requestId);
      if (old) return json(res, 201, true, 'Booking hold created', old);
      const room = rooms.find(item => item.id === data.roomId);
      if (!room || room.inventory <= 0 || data.guests > room.capacity || data.checkIn >= data.checkOut) {
        return json(res, 409, false, 'Room unavailable');
      }
      const nights = Math.round((Date.parse(data.checkOut) - Date.parse(data.checkIn)) / 86400000);
      const confirmed = bookings.filter(item => item.roomId === room.id && ['pending', 'confirmed'].includes(item.status) &&
        item.checkIn < data.checkOut && item.checkOut > data.checkIn);
      if (confirmed.length >= room.inventory) return json(res, 409, false, 'Room unavailable');
      const booking = {
        id: randomUUID().replaceAll('-', '').slice(0, 24),
        guestId: active.user.id, guestName: active.user.firstName + ' ' + active.user.lastName,
        roomId: room.id, roomName: room.name, checkIn: data.checkIn, checkOut: data.checkOut,
        guests: data.guests, quantity: 1, nightlyRate: room.nightlyRate,
        amount: room.nightlyRate * nights, currency: 'NGN', status: 'pending',
        paymentReference: '', requestId: data.requestId, createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      };
      bookings.unshift(booking);
      record('booking.held', booking.id);
      return json(res, 201, true, 'Booking hold created', booking);
    }
    if (url.pathname === '/api/v1/bookings/me' && req.method === 'GET') {
      if (active.user.role !== 'guest') return json(res, 403, false, 'Access denied');
      return json(res, 200, true, 'Bookings retrieved', pageItems(bookings.filter(item => item.guestId === active.user.id), url));
    }
    if (url.pathname === '/api/v1/bookings' && req.method === 'GET') {
      if (!['staff', 'manager'].includes(active.user.role)) return json(res, 403, false, 'Access denied');
      return json(res, 200, true, 'Bookings retrieved', pageItems(bookings, url));
    }
    const bookingRoute = url.pathname.match(/^\/api\/v1\/bookings\/([a-f0-9]{24})(\/cancel)?$/);
    if (bookingRoute) {
      const booking = bookings.find(item => item.id === bookingRoute[1]);
      if (!booking || active.user.role === 'guest' && booking.guestId !== active.user.id) {
        return json(res, 404, false, 'Booking not found');
      }
      if (req.method === 'GET' && !bookingRoute[2]) return json(res, 200, true, 'Booking retrieved', booking);
      if (req.method === 'POST' && bookingRoute[2]) {
        if (active.user.role !== 'guest' || booking.status !== 'pending') return json(res, 409, false, 'Not cancellable');
        booking.status = 'cancelled';
        record('booking.cancelled', booking.id);
        return json(res, 200, true, 'Hold cancelled', booking);
      }
    }
    if (url.pathname === '/api/v1/payments/initialize' && req.method === 'POST') {
      if (active.user.role !== 'guest') return json(res, 403, false, 'Access denied');
      const data = await requestBody(req);
      const booking = bookings.find(item => item.id === data.bookingId && item.guestId === active.user.id);
      if (!booking || booking.status !== 'pending') return json(res, 409, false, 'No active hold');
      let payment = payments.find(item => item.bookingId === booking.id && item.status === 'pending');
      if (!payment) {
        const reference = 'GST-TEST-' + (payments.length + 1);
        payment = {
          id: randomUUID().replaceAll('-', '').slice(0, 24),
          reference, bookingId: booking.id, guestId: active.user.id, status: 'pending',
          amount: booking.amount * 100, currency: 'NGN', refundStatus: 'none',
          paidAt: null, createdAt: new Date().toISOString(),
        };
        payments.unshift(payment);
        booking.paymentReference = reference;
        record('payment.initialized', booking.id, payment.id);
      }
      return json(res, 200, true, 'Payment initialized', {
        bookingId: booking.id, reference: payment.reference, amount: payment.amount,
        currency: 'NGN', expiresAt: booking.expiresAt,
        authorizationUrl: 'https://checkout.paystack.com/fixture?reference=' + payment.reference,
      });
    }
    const paymentStatus = url.pathname.match(/^\/api\/v1\/payments\/([a-zA-Z0-9_-]+)\/status$/);
    if (paymentStatus && req.method === 'GET') {
      const { payment, booking } = bookingForPayment(paymentStatus[1]);
      if (!payment || active.user.role === 'guest' && payment.guestId !== active.user.id) return json(res, 404, false, 'Payment not found');
      return json(res, 200, true, 'Payment status retrieved', {
        reference: payment.reference, status: payment.status, amount: payment.amount,
        currency: 'NGN', booking: payment.bookingId, bookingStatus: booking?.status,
        paidAt: payment.paidAt, refundStatus: payment.refundStatus,
        needsRefund: payment.status === 'refund_required',
      });
    }
    if (url.pathname === '/api/v1/payments' && req.method === 'GET') {
      if (active.user.role !== 'manager') return json(res, 403, false, 'Access denied');
      return json(res, 200, true, 'Payments retrieved', pageItems(payments, url));
    }
    if (url.pathname === '/api/v1/auditlogs' && req.method === 'GET') {
      if (active.user.role !== 'manager') return json(res, 403, false, 'Access denied');
      return json(res, 200, true, 'Audit retrieved', pageItems(audit, url));
    }
    const refund = url.pathname.match(/^\/api\/v1\/payments\/([a-zA-Z0-9_-]+)\/refund$/);
    if (refund && req.method === 'POST') {
      if (active.user.role !== 'manager') return json(res, 403, false, 'Access denied');
      const { payment } = bookingForPayment(refund[1]);
      if (!payment || payment.status !== 'refund_required' || payment.refundStatus !== 'none') return json(res, 409, false, 'Refund not eligible');
      payment.refundStatus = 'pending';
      record('refund.requested', payment.bookingId, payment.id);
      return json(res, 200, true, 'Refund submitted', { reference: payment.reference, refundStatus: 'pending' });
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

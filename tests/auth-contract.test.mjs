import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeApiUser, splitAccountName } from '../services/auth-contract.ts';

test('maps backend role, status, and profile to the existing frontend account', () => {
  const result = normalizeApiUser({
    id: '507f1f77bcf86cd799439011', firstName: 'Amina', lastName: 'Bello',
    email: 'amina@example.com', phone: '+2348012345678', role: 'staff', isActive: false,
  });
  assert.deepEqual(result, {
    id: '507f1f77bcf86cd799439011', name: 'Amina Bello',
    email: 'amina@example.com', role: 'staff', active: false, phone: '+2348012345678',
  });
});

test('splits full names into backend first and last names safely', () => {
  assert.deepEqual(splitAccountName('  Ada  Okafor  Eze '), { firstName: 'Ada', lastName: 'Okafor Eze' });
  assert.throws(() => splitAccountName('Ada'), /first name and a last name/);
  assert.throws(() => splitAccountName('A B'), /first name and a last name/);
});

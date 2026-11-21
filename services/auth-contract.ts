import type { Account, Role } from '@/types/auth';

export type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
};

export function normalizeApiUser(user: ApiUser): Account {
  return {
    id: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email,
    role: user.role,
    active: user.isActive,
    phone: user.phone || '',
  };
}

export function splitAccountName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  if (firstName.length < 2 || lastName.length < 2 || firstName.length > 100 || lastName.length > 100) {
    throw new Error('Enter both a first name and a last name.');
  }
  return { firstName, lastName };
}

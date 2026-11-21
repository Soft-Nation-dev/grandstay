import { apiRequest, ApiError, type ApiRequestOptions } from '@/services/api-client';
import { normalizeApiUser, splitAccountName, type ApiUser } from '@/services/auth-contract';
import type { Account, Credentials, Registration, TeamAccess, TeamRegistration } from '@/types/auth';

const tokenKey = 'guestly.api.session.v1';
const eventName = 'guestly:api-auth';
let account: Account | null = null;
let initialized = false;
let initialization: Promise<void> | null = null;
let generation = 0;
let team: Account[] = [];

function announce() {
  window.dispatchEvent(new Event(eventName));
}

function token() {
  return sessionStorage.getItem(tokenKey);
}

export async function authorizedRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const currentToken = token();
  if (!currentToken) throw new Error('Sign in to continue.');
  try {
    return await apiRequest<T>(path, { ...options, token: currentToken });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      generation += 1;
      sessionStorage.removeItem(tokenKey);
      team = [];
      setAccount(null);
    }
    throw error;
  }
}

function setAccount(value: Account | null) {
  account = value;
  initialized = true;
  announce();
}

export function backendSessionSnapshot() {
  return initialized ? JSON.stringify(account) : '';
}

export function backendAccountsSnapshot() {
  return JSON.stringify(team);
}

export function backendSession() {
  return account;
}

export function backendAccounts() {
  return team;
}

export function subscribeBackendAuth(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}

export function initializeBackendAuth() {
  if (initialization || initialized) return initialization;
  const currentToken = token();
  if (!currentToken) {
    setAccount(null);
    return null;
  }
  const requested = generation;
  initialization = apiRequest<ApiUser>('/api/v1/auth/me', { token: currentToken })
    .then(data => {
      if (requested === generation) setAccount(normalizeApiUser(data));
    })
    .catch(error => {
      if (requested !== generation) return;
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        sessionStorage.removeItem(tokenKey);
      }
      setAccount(null);
    })
    .finally(() => { initialization = null; });
  return initialization;
}

export async function backendSignIn({ email, password }: Credentials) {
  const data = await apiRequest<{ token: string; user: ApiUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
  generation += 1;
  sessionStorage.setItem(tokenKey, data.token);
  team = [];
  setAccount(normalizeApiUser(data.user));
  return account as Account;
}

export async function backendRegisterGuest({ name, email, password }: Registration) {
  await apiRequest<ApiUser>('/api/v1/auth/register', {
    method: 'POST',
    body: { ...splitAccountName(name), email: email.trim().toLowerCase(), password, confirmPassword: password },
  });
  return backendSignIn({ email, password });
}

export async function backendSignOut() {
  const currentToken = token();
  generation += 1;
  sessionStorage.removeItem(tokenKey);
  team = [];
  setAccount(null);
  if (currentToken) {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST', token: currentToken });
    } catch {
      return;
    }
  }
}

export async function refreshBackendTeam() {
  const currentToken = token();
  if (!currentToken || account?.role !== 'admin') throw new Error('Only the super admin can manage team accounts.');
  const users = await authorizedRequest<ApiUser[]>('/api/v1/users/team');
  team = users.map(normalizeApiUser);
  announce();
  return team;
}

export async function backendProvisionTeam({ name, email, password, role }: TeamRegistration) {
  const currentToken = token();
  if (!currentToken || account?.role !== 'admin') throw new Error('Only the super admin can manage team accounts.');
  const user = await authorizedRequest<ApiUser>('/api/v1/users/team', {
    method: 'POST',
    body: { ...splitAccountName(name), email: email.trim().toLowerCase(), password, confirmPassword: password, role },
  });
  const created = normalizeApiUser(user);
  team = [...team.filter(item => item.id !== created.id), created];
  announce();
  return created;
}

export async function backendUpdateTeamAccess(id: string, access: TeamAccess) {
  const currentToken = token();
  if (!currentToken || account?.role !== 'admin') throw new Error('Only the super admin can manage team accounts.');
  const user = await authorizedRequest<ApiUser>('/api/v1/users/team/' + encodeURIComponent(id) + '/access', {
    method: 'PATCH',
    body: { role: access.role, isActive: access.active },
  });
  const updated = normalizeApiUser(user);
  team = team.map(item => item.id === updated.id ? updated : item);
  announce();
  return updated;
}

export async function backendUpdateProfile({ firstName, lastName, phone }: { firstName: string; lastName: string; phone?: string }) {
  const currentToken = token();
  if (!currentToken || !account) throw new Error('Sign in to update your profile.');
  const user = await authorizedRequest<ApiUser>('/api/v1/auth/me', {
    method: 'PATCH',
    body: { firstName, lastName, phone },
  });
  setAccount(normalizeApiUser(user));
  return account as Account;
}

'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { apiConfigured } from '@/services/api-client';
import { getAccounts, getSession, subscribeAuth } from '@/services/auth';
import { backendAccountsSnapshot, backendSessionSnapshot, initializeBackendAuth } from '@/services/backend-auth';
import type { Account } from '@/types/auth';

const sessionSnapshot = () => apiConfigured() ? backendSessionSnapshot() : JSON.stringify(getSession());
const accountsSnapshot = () => apiConfigured() ? backendAccountsSnapshot() : JSON.stringify(getAccounts());
const serverSnapshot = () => '';

export function useAuth(): Account | null | undefined {
  useEffect(() => {
    if (apiConfigured()) void initializeBackendAuth();
  }, []);
  const snapshot = useSyncExternalStore(subscribeAuth, sessionSnapshot, serverSnapshot);
  return snapshot ? JSON.parse(snapshot) : undefined;
}

export function useAccounts(): Account[] {
  const snapshot = useSyncExternalStore(subscribeAuth, accountsSnapshot, serverSnapshot);
  return snapshot ? JSON.parse(snapshot) : [];
}

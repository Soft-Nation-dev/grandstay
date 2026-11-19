"use client";

import { useSyncExternalStore } from "react";
import { getAccounts, getSession, subscribeAuth } from "@/services/auth";
import type { Account } from "@/types/auth";

const sessionSnapshot = () => JSON.stringify(getSession());
const accountsSnapshot = () => JSON.stringify(getAccounts());
const serverSnapshot = () => "";

export function useAuth(): Account | null | undefined {
  const snapshot = useSyncExternalStore(subscribeAuth, sessionSnapshot, serverSnapshot);
  return snapshot ? JSON.parse(snapshot) : undefined;
}

export function useAccounts(): Account[] {
  const snapshot = useSyncExternalStore(subscribeAuth, accountsSnapshot, serverSnapshot);
  return snapshot ? JSON.parse(snapshot) : [];
}

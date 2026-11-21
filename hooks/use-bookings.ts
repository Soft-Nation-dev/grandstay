"use client";

import { useEffect, useSyncExternalStore } from "react";
import { apiConfigured } from "@/services/api-client";
import { useAuth } from "@/hooks/use-auth";
import { initialBookingStore } from "@/data/mock";
import { readBookingStore, subscribeBookings } from "@/services/booking-store";
import {
  backendBookingSnapshot, backendBookingServerSnapshot, subscribeBackendBookings,
  refreshBackendBookings, resetBackendBookings,
} from "@/services/backend-bookings";
import type { BookingStore } from "@/types/booking";

const demoSnapshot = () => JSON.stringify(readBookingStore());
const demoServerSnapshot = () => JSON.stringify(initialBookingStore);

export function useBookingStore(): BookingStore {
  const account = useAuth();
  const accountId = account?.id;
  const accountRole = account?.role;
  useEffect(() => {
    if (!apiConfigured()) return;
    if (accountId && accountRole && ["guest", "staff", "manager"].includes(accountRole)) {
      void refreshBackendBookings({ id: accountId, role: accountRole }).catch(() => {});
    } else if (accountRole === undefined && account === null) {
      resetBackendBookings();
    }
  }, [accountId, accountRole, account === null]);

  const snapshot = useSyncExternalStore(
    apiConfigured() ? subscribeBackendBookings : subscribeBookings,
    apiConfigured() ? backendBookingSnapshot : demoSnapshot,
    apiConfigured() ? backendBookingServerSnapshot : demoServerSnapshot,
  );
  return JSON.parse(snapshot) as BookingStore;
}

"use client";

import { useSyncExternalStore } from "react";
import { initialBookingStore } from "@/data/mock";
import { readBookingStore, subscribeBookings } from "@/services/booking-store";
import type { BookingStore } from "@/types/booking";

const snapshot = () => JSON.stringify(readBookingStore());
const serverSnapshot = () => JSON.stringify(initialBookingStore);

export function useBookingStore(): BookingStore {
  return JSON.parse(useSyncExternalStore(subscribeBookings, snapshot, serverSnapshot));
}

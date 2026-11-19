import { initialBookingStore } from "@/data/mock";
import type { BookingStore } from "@/types/booking";

const key = "grandstay.demo.bookings.v1";
const changeEvent = "grandstay:bookings";

export function readBookingStore(): BookingStore {
  if (typeof window === "undefined") return initialBookingStore;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initialBookingStore;
    const parsed = JSON.parse(raw) as BookingStore;
    return Array.isArray(parsed.bookings) && Array.isArray(parsed.audit) ? parsed : initialBookingStore;
  } catch {
    return initialBookingStore;
  }
}

export function writeBookingStore(store: BookingStore) {
  localStorage.setItem(key, JSON.stringify(store));
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeBookings(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

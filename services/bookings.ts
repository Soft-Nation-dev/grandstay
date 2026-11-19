import { getSession } from "@/services/auth";
import { readBookingStore, writeBookingStore } from "@/services/booking-store";
import { availableInventory, getRoom } from "@/services/rooms";
import { localDate, stayNights } from "@/lib/format";
import { bookingQuery, readStay } from "@/lib/booking-query";
import type { Room } from "@/types/hotel";
import type { Booking, BookingAudit, BookingInput, PaymentOutcome } from "@/types/booking";

function requireGuest() {
  const account = getSession();
  if (account?.role !== "guest") throw new Error("Sign in with a guest account to reserve a room.");
  return account;
}

export function quoteBooking(input: BookingInput, bookings: Booking[], rooms?: Room[]) {
  const stay = readStay(new URLSearchParams(bookingQuery(input)));
  const room = getRoom(input.roomId, rooms);
  if (!stay || !room || input.checkIn < localDate() || input.guests > room.capacity || !availableInventory(room, input, bookings)) throw new Error("This room is not available for the selected stay. Please review your dates.");
  const nights = stayNights(input.checkIn, input.checkOut);
  return { room, nights, amount: room.nightlyRate * nights };
}

function audit(guestId: string, reference: string, event: BookingAudit["event"]): BookingAudit {
  return { id: crypto.randomUUID(), guestId, reference, event, createdAt: new Date().toISOString() };
}

export function completeDemoPayment(input: BookingInput, reference: string, outcome: PaymentOutcome) {
  const guest = requireGuest();
  const store = readBookingStore();
  const previous = store.bookings.find(booking => booking.paymentReference === reference && booking.guestId === guest.id);
  if (previous) return previous;
  if (store.audit.some(item => item.reference === reference)) throw new Error("This payment attempt has ended. Start a new attempt.");
  const started = audit(guest.id, reference, "payment_started");
  if (outcome !== "success") {
    writeBookingStore({ ...store, audit: [...store.audit, started, audit(guest.id, reference, outcome === "failed" ? "payment_failed" : "payment_cancelled")] });
    return null;
  }
  const quote = quoteBooking(input, store.bookings);
  const booking: Booking = { ...input, id: `GY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, guestId: guest.id, guestName: guest.name, roomName: quote.room.name, nightlyRate: quote.room.nightlyRate, amount: quote.amount, currency: "NGN", status: "confirmed", paymentReference: reference, createdAt: new Date().toISOString() };
  writeBookingStore({ bookings: [...store.bookings, booking], audit: [...store.audit, started, audit(guest.id, reference, "payment_verified"), audit(guest.id, reference, "booking_confirmed")] });
  return booking;
}

import type { StaySearch } from "@/types/hotel";

export type BookingInput = StaySearch & { roomId: string };
export type PaymentOutcome = "success" | "failed" | "cancelled";
export type Booking = BookingInput & {
  id: string;
  guestId: string;
  guestName: string;
  roomName: string;
  nightlyRate: number;
  amount: number;
  currency: "NGN";
  status: "confirmed";
  paymentReference: string;
  createdAt: string;
};
export type BookingAudit = {
  id: string;
  guestId: string;
  reference: string;
  event: "payment_started" | "payment_failed" | "payment_cancelled" | "payment_verified" | "booking_confirmed";
  createdAt: string;
};
export type BookingStore = { bookings: Booking[]; audit: BookingAudit[] };

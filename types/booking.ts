import type { StaySearch } from "@/types/hotel";

export type BookingInput = StaySearch & { roomId: string };
export type PaymentOutcome = "success" | "failed" | "cancelled";
export type BookingStatus = "pending" | "confirmed" | "expired" | "cancelled";
export type Booking = BookingInput & {
  id: string;
  guestId: string;
  guestName: string;
  roomName: string;
  nightlyRate: number;
  amount: number;
  currency: "NGN";
  status: BookingStatus;
  paymentReference: string;
  createdAt: string;
  expiresAt?: string;
  quantity?: number;
};
export type BookingAudit = {
  id: string;
  guestId: string;
  reference: string;
  event: string;
  createdAt: string;
};
export type PaymentStatus = "pending" | "success" | "failed" | "abandoned" | "review_required" | "refund_required" | "refunded";
export type PaymentRecord = {
  id: string;
  bookingId: string;
  reference: string;
  amount: number;
  currency: "NGN";
  status: PaymentStatus;
  refundStatus: string;
  paidAt: string | null;
  createdAt: string;
};
export type BookingStore = {
  bookings: Booking[];
  audit: BookingAudit[];
  payments?: PaymentRecord[];
  loading?: boolean;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
};

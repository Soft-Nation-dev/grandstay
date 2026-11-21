import { authorizedRequest } from "@/services/backend-auth";
import type { Account } from "@/types/auth";
import type { Booking, BookingInput, BookingStore, PaymentRecord, PaymentStatus } from "@/types/booking";

export type PaymentVerification = {
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: "NGN";
  booking: string;
  bookingStatus: string;
  paidAt: string | null;
  refundStatus: string;
  needsRefund: boolean;
};
export type PaymentAuthorization = {
  bookingId: string;
  authorizationUrl: string;
  reference: string;
  amount: number;
  currency: "NGN";
  expiresAt: string;
};
type Page<T> = { items: T[]; total: number; page: number; limit: number };
type AuditEvent = { id: string; action: string; bookingId: string | null; paymentId: string | null; createdAt: string };

const event = "guestly:backend-bookings";
const initial: BookingStore = { bookings: [], audit: [], payments: [], loading: false, error: "", page: 1, total: 0, limit: 100 };
const initialSnapshot = JSON.stringify(initial);
let state: BookingStore = initial;
let identity = "";
let loaded = false;
let request: Promise<void> | null = null;
let revision = 0;

function announce() {
  window.dispatchEvent(new Event(event));
}

function update(changes: Partial<BookingStore>) {
  state = { ...state, ...changes };
  announce();
}

function keyOf(account: Pick<Account, "id" | "role">) {
  return account.role + ":" + account.id;
}

function auditRecord(item: AuditEvent) {
  return {
    id: item.id,
    guestId: "",
    reference: item.bookingId || item.paymentId || "",
    event: item.action,
    createdAt: item.createdAt,
  };
}

export function backendBookingSnapshot() {
  return JSON.stringify(state);
}

export function backendBookingServerSnapshot() {
  return initialSnapshot;
}

export function subscribeBackendBookings(listener: () => void) {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}

export function resetBackendBookings() {
  revision += 1;
  identity = "";
  loaded = false;
  request = null;
  state = initial;
  announce();
}

export async function refreshBackendBookings(account: Pick<Account, "id" | "role">, force = false) {
  if (!["guest", "staff", "manager"].includes(account.role)) return;
  const key = keyOf(account);
  if (identity !== key) {
    revision += 1;
    identity = key;
    loaded = false;
    request = null;
    state = initial;
  }
  if (request) return request;
  if (loaded && !force) return;
  const thisRevision = revision;
  update({ loading: true, error: "" });
  const route = account.role === "guest" ? "/api/v1/bookings/me" : "/api/v1/bookings";
  request = (async () => {
    try {
      const [bookings, payments, audits] = await Promise.all([
        authorizedRequest<Page<Booking>>(route + "?page=1&limit=100"),
        account.role === "manager"
          ? authorizedRequest<Page<PaymentRecord>>("/api/v1/payments?page=1&limit=100")
          : Promise.resolve(null),
        account.role === "manager"
          ? authorizedRequest<Page<AuditEvent>>("/api/v1/auditlogs?page=1&limit=100")
          : Promise.resolve(null),
      ]);
      if (thisRevision !== revision) return;
      loaded = true;
      update({
        bookings: bookings.items,
        total: bookings.total,
        page: bookings.page,
        limit: bookings.limit,
        payments: payments?.items || [],
        audit: audits?.items.map(auditRecord) || [],
        loading: false,
        error: "",
      });
    } catch (error) {
      if (thisRevision !== revision) return;
      update({
        loading: false,
        error: error instanceof Error ? error.message : "Could not retrieve reservations.",
      });
      throw error;
    } finally {
      if (thisRevision === revision) request = null;
    }
  })();
  return request;
}

export async function loadMoreBackendBookings(account: Pick<Account, "id" | "role">) {
  if (identity !== keyOf(account) || state.loading || !state.total || state.bookings.length >= state.total) return;
  const page = (state.page || 1) + 1;
  const route = account.role === "guest" ? "/api/v1/bookings/me" : "/api/v1/bookings";
  update({ loading: true, error: "" });
  try {
    const result = await authorizedRequest<Page<Booking>>(route + "?page=" + page + "&limit=100");
    if (identity !== keyOf(account)) return;
    const ids = new Set(state.bookings.map(item => item.id));
    update({ bookings: [...state.bookings, ...result.items.filter(item => !ids.has(item.id))], page: result.page, total: result.total, loading: false });
  } catch (error) {
    update({ loading: false, error: error instanceof Error ? error.message : "Could not load more bookings." });
  }
}

export async function createBackendHold(input: BookingInput, requestId: string) {
  const booking = await authorizedRequest<Booking>("/api/v1/bookings", {
    method: "POST", body: { ...input, requestId },
  });
  const existed = state.bookings.some(item => item.id === booking.id);
  update({ bookings: [booking, ...state.bookings.filter(item => item.id !== booking.id)], total: (state.total || 0) + (existed ? 0 : 1) });
  return booking;
}

export async function getBackendBooking(id: string) {
  return authorizedRequest<Booking>("/api/v1/bookings/" + encodeURIComponent(id));
}

export async function cancelBackendHold(id: string) {
  const booking = await authorizedRequest<Booking>("/api/v1/bookings/" + encodeURIComponent(id) + "/cancel", { method: "POST" });
  update({ bookings: state.bookings.map(item => item.id === id ? booking : item) });
  return booking;
}

export async function initializeBackendPayment(bookingId: string) {
  const payment = await authorizedRequest<PaymentAuthorization>("/api/v1/payments/initialize", { method: "POST", body: { bookingId } });
  const url = new URL(payment.authorizationUrl);
  if (url.protocol !== "https:" || !(url.hostname === "paystack.com" || url.hostname.endsWith(".paystack.com"))) {
    throw new Error("The payment provider returned an invalid checkout URL.");
  }
  return payment;
}

export async function verifyBackendPayment(reference: string) {
  return authorizedRequest<PaymentVerification>("/api/v1/payments/" + encodeURIComponent(reference) + "/status");
}

export async function requestBackendRefund(reference: string) {
  return authorizedRequest<{ reference: string; refundStatus: string }>("/api/v1/payments/" + encodeURIComponent(reference) + "/refund", { method: "POST" });
}

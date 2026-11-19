import { localDate } from "@/lib/format";
import { documentKinds } from "@/data/mock";
import { readManagementStore } from "@/services/management-store";
import { getSession, getAccounts } from "@/services/auth";
import { readBookingStore } from "@/services/booking-store";
import { readExperienceStore, writeExperienceStore } from "@/services/experience-store";
import type { Role } from "@/types/auth";
import type { Booking } from "@/types/booking";
import type { CheckIn, CheckInInput } from "@/types/experience";

function requireRole(role: Role) {
  const account = getSession();
  if (account?.role !== role) throw new Error("You do not have access to this action.");
  return account;
}

function guestBooking(id: string, guestId: string) {
  const booking = readBookingStore().bookings.find(item => item.id === id && item.guestId === guestId);
  if (!booking) throw new Error("Choose a confirmed reservation.");
  return booking;
}

export function hotelDate(now = new Date()) {
  return localDate(now);
}

export function activeStay(booking: Booking, today = hotelDate()) {
  return booking.checkIn <= today && today < booking.checkOut;
}

export function roomAccess(booking: Booking, checkIn?: CheckIn, now = Date.now()) {
  const startsAt = new Date(`${booking.checkIn}T14:00:00+01:00`).getTime();
  const expiresAt = new Date(`${booking.checkOut}T12:00:00+01:00`).getTime();
  const approvedAt = checkIn?.reviewedAt ? Date.parse(checkIn.reviewedAt) : 0;
  const validFrom = Math.max(startsAt, approvedAt);
  const status = !checkIn || checkIn.status !== "approved" || !checkIn.accessCode ? "unavailable" : now >= expiresAt ? "expired" : now < validFrom ? "scheduled" : "active";
  return { status, validFrom, expiresAt, code: status === "active" || status === "scheduled" ? checkIn?.accessCode : undefined } as const;
}

export function submitCheckIn(input: CheckInInput) {
  const guest = requireRole("guest");
  const booking = guestBooking(input.bookingId, guest.id);
  if (booking.checkOut <= hotelDate()) throw new Error("This stay has ended.");
  if (!documentKinds.includes(input.documentKind) || !input.sampleSelected || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.arrivalTime)) throw new Error("Choose an arrival time and a sample document.");
  const store = readExperienceStore();
  const existing = store.checkIns.find(item => item.bookingId === booking.id);
  if (existing && existing.status !== "rejected") throw new Error("This check-in has already been submitted.");
  const checkIn: CheckIn = { bookingId: booking.id, guestId: guest.id, arrivalTime: input.arrivalTime, documentKind: input.documentKind, status: "pending", submittedAt: new Date().toISOString() };
  writeExperienceStore({ ...store, checkIns: [...store.checkIns.filter(item => item.bookingId !== booking.id), checkIn] });
}

export function reviewCheckIn(bookingId: string, approved: boolean, note: string) {
  requireRole("staff");
  const store = readExperienceStore();
  const checkIn = store.checkIns.find(item => item.bookingId === bookingId);
  const booking = readBookingStore().bookings.find(item => item.id === bookingId);
  if (!checkIn || checkIn.status !== "pending" || !booking) throw new Error("This submission is no longer pending.");
  if (booking.checkOut <= hotelDate()) throw new Error("This stay has ended.");
  if (!approved && !note.trim()) throw new Error("Provide a reason for rejection.");
  const accessCode = approved ? String(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000) : undefined;
  writeExperienceStore({ ...store, checkIns: store.checkIns.map(item => item.bookingId === bookingId ? { ...item, status: approved ? "approved" : "rejected", reviewedAt: new Date().toISOString(), reviewNote: note.trim(), accessCode } : item) });
}

export function createServiceRequest(bookingId: string, category: string, details: string) {
  const guest = requireRole("guest");
  const booking = guestBooking(bookingId, guest.id);
  if (!activeStay(booking)) throw new Error("Services are available during your stay.");
  if (!readManagementStore().services.some(item => item.active && item.name === category) || details.length > 500) throw new Error("Check the service category and request details.");
  const store = readExperienceStore();
  const at = new Date().toISOString();
  writeExperienceStore({ ...store, requests: [...store.requests, { id: crypto.randomUUID(), bookingId, guestId: guest.id, category, details: details.trim(), status: "received", history: [{ status: "received", at }] }] });
}

export function advanceRequest(id: string) {
  requireRole("staff");
  const store = readExperienceStore();
  const request = store.requests.find(item => item.id === id);
  if (!request || request.status === "done") throw new Error("This request cannot be updated.");
  const status = request.status === "received" ? "in-progress" : "done";
  writeExperienceStore({ ...store, requests: store.requests.map(item => item.id === id ? { ...item, status, history: [...item.history, { status, at: new Date().toISOString() }] } : item) });
}

export function sendMessage(guestId: string, text: string) {
  const account = getSession();
  if (!account || (account.role !== "guest" && account.role !== "staff")) throw new Error("Sign in to use the concierge.");
  if (account.role === "guest" && account.id !== guestId) throw new Error("This conversation is not yours.");
  if (!getAccounts().some(item => item.id === guestId && item.role === "guest")) throw new Error("Guest not found.");
  const message = text.trim();
  if (!message || message.length > 1000) throw new Error("Enter a message of up to 1,000 characters.");
  const store = readExperienceStore();
  writeExperienceStore({ ...store, messages: [...store.messages, { id: crypto.randomUUID(), guestId, sender: account.role, senderName: account.name, text: message, createdAt: new Date().toISOString() }] });
}

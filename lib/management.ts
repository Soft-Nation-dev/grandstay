import type { Booking, BookingAudit } from "@/types/booking";
import type { CheckIn, ServiceRequest } from "@/types/experience";
import type { LoyaltyRule } from "@/types/management";
import { stayNights } from "@/lib/format";

export function loyaltyAwards(bookings: Booking[], checkIns: CheckIn[], rules: LoyaltyRule[], now = Date.now()) {
  return bookings.flatMap(booking => {
    const checkout = Date.parse(`${booking.checkOut}T12:00:00+01:00`);
    const checkIn = checkIns.find(item => item.bookingId === booking.id && item.status === "approved");
    if (!checkIn || !Number.isFinite(checkout) || checkout > now) return [];
    const rule = [...rules].filter(item => Date.parse(item.effectiveAt) <= checkout).sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt))[0];
    const nights = stayNights(booking.checkIn, booking.checkOut);
    return rule && nights ? [{ booking, nights, points: nights * rule.pointsPerNight }] : [];
  });
}

export function bookingMetrics(bookings: Booking[], audit: BookingAudit[]) {
  const attempts = new Set(audit.filter(item => item.event === "payment_started").map(item => item.reference)).size;
  const verified = new Set(audit.filter(item => item.event === "payment_verified").map(item => item.reference)).size;
  return { total: bookings.length, revenue: bookings.reduce((sum, item) => sum + item.amount, 0), attempts, verified, conversion: attempts ? Math.round(verified / attempts * 100) : null };
}

export function serviceMetrics(requests: ServiceRequest[]) {
  const done = requests.filter(item => item.status === "done");
  const durations = done.flatMap(item => {
    const start = item.history.find(event => event.status === "received");
    const end = item.history.find(event => event.status === "done");
    const minutes = start && end ? (Date.parse(end.at) - Date.parse(start.at)) / 60000 : -1;
    return Number.isFinite(minutes) && minutes >= 0 ? [minutes] : [];
  });
  return { total: requests.length, received: requests.filter(item => item.status === "received").length, inProgress: requests.filter(item => item.status === "in-progress").length, done: done.length, completion: requests.length ? Math.round(done.length / requests.length * 100) : null, averageMinutes: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null };
}

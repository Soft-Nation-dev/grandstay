import type { Booking } from "@/types/booking";
import type { RecordedBooking } from "@/services/hotel-dataset";

export function guestStay(bookings: Booking[], records: RecordedBooking[], guestId: string, today: string) {
  const own = bookings.filter(item => item.guestId === guestId && item.status === "confirmed");
  const active = own.filter(item => item.checkOut > today).sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.createdAt.localeCompare(b.createdAt));
  const current = active.find(item => item.checkIn <= today) ?? active[0];
  if (current) return { kind: "active", booking: current, current: current.checkIn <= today, count: active.length } as const;
  const past = own.filter(item => item.checkOut <= today).sort((a, b) => b.checkOut.localeCompare(a.checkOut))[0];
  const recorded = [...records].filter(item => item.Booking_Status === "Completed" && item.Check_Out <= today).sort((a, b) => b.Check_Out.localeCompare(a.Check_Out))[0];
  if (past && (!recorded || past.checkOut >= recorded.Check_Out)) return { kind: "past", booking: past } as const;
  if (recorded) return { kind: "recorded", booking: recorded, past: true } as const;
  const latest = [...records].sort((a, b) => b.Booking_Date.localeCompare(a.Booking_Date))[0];
  return latest ? { kind: "recorded", booking: latest, past: false } as const : { kind: "empty" } as const;
}

import type { Booking } from "@/types/booking";
import type { CheckIn, ConciergeMessage, ServiceRequest } from "@/types/experience";

export function stayPhase(booking: Booking, today: string) {
  return booking.checkOut <= today ? "past" : booking.checkIn > today ? "upcoming" : "current";
}

export function latestConversations(messages: ConciergeMessage[]) {
  const latest = new Map<string, ConciergeMessage>();
  for (const message of messages) {
    const previous = latest.get(message.guestId);
    if (!previous || message.createdAt >= previous.createdAt) latest.set(message.guestId, message);
  }
  return [...latest.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function staffSnapshot(bookings: Booking[], checkIns: CheckIn[], requests: ServiceRequest[], messages: ConciergeMessage[], today: string) {
  const arrivals = bookings.filter(item => item.status === "confirmed" && item.checkIn >= today).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const pending = checkIns.filter(item => item.status === "pending" && bookings.some(booking => booking.id === item.bookingId && booking.checkOut > today)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const openRequests = requests.filter(item => item.status !== "done").sort((a, b) => (a.history[0]?.at ?? "").localeCompare(b.history[0]?.at ?? ""));
  const conversations = latestConversations(messages);
  return { arrivals, pending, openRequests, conversations, arrivalsToday: arrivals.filter(item => item.checkIn === today).length, repliesNeeded: conversations.filter(item => item.sender === "guest").length };
}

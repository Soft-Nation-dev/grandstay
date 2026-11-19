"use client";

import Link from "@/components/navigation/app-link";
import { datasetGuestId, recordedBookings } from "@/services/hotel-dataset";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { useManagement } from "@/hooks/use-management";
import { recommendRooms } from "@/lib/recommendations";
import { RoomCard } from "@/components/public/room-card";
import { Icon } from "@/components/ui/icon";

export function RecommendedRooms() {
  const account = useAuth();
  const { bookings } = useBookingStore();
  const { rooms } = useManagement();
  if (!account || account.role !== "guest") return null;
  const importedGuest = datasetGuestId(account.id);
  const history = importedGuest ? recordedBookings(importedGuest).filter(item => item.Booking_Status === "Completed") : [];
  const categories = rooms.map(item => item.category);
  const preference = history.filter(item => categories.some(category => category === item.Room_Type)).map(item => item.Room_Type).sort((a, b) => history.filter(item => item.Room_Type === b).length - history.filter(item => item.Room_Type === a).length)[0];
  const recommended = recommendRooms(rooms, bookings, account.id, preference);
  if (!recommended.length) return null;
  const returning = history.length > 0 || bookings.some(item => item.guestId === account.id);
  return <section className="workspace-section"><div className="section-heading"><div><span className="eyebrow">Your next stay</span><h2>Recommended for you</h2><p className="muted">{returning ? "Inspired by your previous reservations." : "Explore a selection of our rooms and suites."}</p></div><Link className="text-link" href="/rooms">All rooms <Icon name="arrow" /></Link></div><div className="room-grid">{recommended.map(room => <RoomCard key={room.id} room={room} />)}</div></section>;
}

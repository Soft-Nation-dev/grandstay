"use client";

import { useManagement } from "@/hooks/use-management";
import { getFeaturedRooms } from "@/services/rooms";
import { RoomCard } from "@/components/public/room-card";

export function FeaturedRooms() {
  const { rooms } = useManagement();
  const featured = getFeaturedRooms(rooms);
  return featured.length ? <div className="room-grid">{featured.map(room => <RoomCard key={room.id} room={room} />)}</div> : <p className="muted">Explore the room catalogue for current availability.</p>;
}

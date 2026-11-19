import type { Booking } from "@/types/booking";
import type { Room } from "@/types/hotel";

export function recommendRooms(rooms: Room[], bookings: Booking[], guestId: string) {
  const history = bookings.filter(item => item.guestId === guestId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recent = history[0];
  const previousRoom = rooms.find(room => room.id === recent?.roomId);
  const eligible = rooms.filter(room => room.inventory > 0 && (!recent || room.capacity >= recent.guests));
  return eligible.map(room => ({ room, rank: (room.id === recent?.roomId ? 8 : 0) + (previousRoom && room.category === previousRoom.category ? 5 : 0) + (room.featured ? 2 : 0) })).sort((a, b) => b.rank - a.rank || a.room.nightlyRate - b.room.nightlyRate).slice(0, 3).map(item => item.room);
}

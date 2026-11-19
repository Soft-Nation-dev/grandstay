import { reservations, rooms } from "@/data/mock";
import { stayNights } from "@/lib/format";
import type { Room, StaySearch } from "@/types/hotel";

export const getRooms = () => rooms;
export const getFeaturedRooms = () => rooms.filter((room) => room.featured);
export const getRoom = (id: string) => rooms.find((room) => room.id === id);

export function availableInventory(room: Room, stay: StaySearch) {
  if (!stayNights(stay.checkIn, stay.checkOut)) return 0;
  return Math.max(0, room.inventory - reservations.filter((reservation) =>
    reservation.roomId === room.id && reservation.checkIn < stay.checkOut && reservation.checkOut > stay.checkIn
  ).reduce((total, reservation) => total + reservation.quantity, 0));
}

export function findRooms(stay: StaySearch) {
  return rooms.filter((room) => room.capacity >= stay.guests && availableInventory(room, stay) > 0);
}

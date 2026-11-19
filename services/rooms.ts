import { reservations } from "@/data/mock";
import { readManagementStore } from "@/services/management-store";
import { stayNights } from "@/lib/format";
import type { Room, StaySearch, RoomReservation } from "@/types/hotel";
import type { Booking } from "@/types/booking";

export const getRooms = () => readManagementStore().rooms;
export const getFeaturedRooms = (rooms = getRooms()) => rooms.filter(room => room.featured && room.inventory > 0);
export const getRoom = (id: string, rooms = getRooms()) => rooms.find((room) => room.id === id);

export function availableInventory(room: Room, stay: StaySearch, bookings: Booking[] = []) {
  if (!stayNights(stay.checkIn, stay.checkOut)) return 0;
  const all: RoomReservation[] = [...reservations, ...bookings.map(({ roomId, checkIn, checkOut }) => ({ roomId, checkIn, checkOut, quantity: 1 }))];
  const overlapping = all.filter(item => item.roomId === room.id && item.checkIn < stay.checkOut && item.checkOut > stay.checkIn);
  const events = overlapping.flatMap(item => [{ date: item.checkIn < stay.checkIn ? stay.checkIn : item.checkIn, delta: item.quantity }, { date: item.checkOut, delta: -item.quantity }]).sort((a, b) => a.date.localeCompare(b.date) || a.delta - b.delta);
  let occupied = 0;
  let peak = 0;
  for (const event of events) {
    occupied += event.delta;
    peak = Math.max(peak, occupied);
  }
  return Math.max(0, room.inventory - peak);
}

export function findRooms(stay: StaySearch, bookings: Booking[] = [], rooms = getRooms()) {
  return rooms.filter(room => room.capacity >= stay.guests && availableInventory(room, stay, bookings) > 0);
}

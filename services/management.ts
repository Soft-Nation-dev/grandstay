import { getSession } from "@/services/auth";
import { apiConfigured } from "@/services/api-client";
import { saveBackendRoom } from "@/services/backend-rooms";
import { readBookingStore } from "@/services/booking-store";
import { readManagementStore, writeManagementStore } from "@/services/management-store";
import { reservations, roomImages } from "@/data/mock";
import type { Room } from "@/types/hotel";
import type { ServiceCategory } from "@/types/management";

function requireManager() {
  if (getSession()?.role !== "manager") throw new Error("Only managers can change hotel settings.");
}

export async function saveRoom(input: Omit<Room, "id">, id?: string) {
  requireManager();
  if (apiConfigured()) return saveBackendRoom(input, id);
  const store = readManagementStore();
  const name = input.name.trim();
  if (!name || name.length > 80 || !input.description.trim() || !input.bed.trim() || !input.view.trim()) throw new Error("Complete the room details.");
  if (!["Standard", "Deluxe", "Executive"].includes(input.category) || !Number.isSafeInteger(input.nightlyRate) || input.nightlyRate < 1 || input.nightlyRate > 100000000 || !Number.isInteger(input.inventory) || input.inventory < 0 || input.inventory > 1000 || !Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 3 || !Number.isFinite(input.size) || input.size <= 0) throw new Error("Check the price, room size, inventory and capacity.");
  if (!roomImages.includes(input.image) && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.image)) throw new Error("Select a room image.");
  if (input.image.length > 450000) throw new Error("Choose a smaller image.");
  if (id && !store.rooms.some(item => item.id === id)) throw new Error("Room type not found.");
  if (store.rooms.some(item => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) throw new Error("A room type with this name already exists.");
  if (id) {
    const all = [...reservations, ...readBookingStore().bookings.map(item => ({ ...item, quantity: 1 }))].filter(item => item.roomId === id && Date.parse(`${item.checkOut}T12:00:00+01:00`) > Date.now());
    const events = all.flatMap(item => [{ date: item.checkIn, delta: item.quantity }, { date: item.checkOut, delta: -item.quantity }]).sort((a, b) => a.date.localeCompare(b.date) || a.delta - b.delta);
    let occupied = 0;
    let peak = 0;
    for (const event of events) { occupied += event.delta; peak = Math.max(peak, occupied); }
    if (input.inventory < peak) throw new Error(`Keep at least ${peak} rooms to honour confirmed reservations.`);
    if (readBookingStore().bookings.some(item => item.roomId === id && Date.parse(`${item.checkOut}T12:00:00+01:00`) > Date.now() && item.guests > input.capacity)) throw new Error("Capacity cannot be reduced below an existing reservation.");
  }
  const room = { ...input, name, id: id ?? crypto.randomUUID(), description: input.description.trim(), bed: input.bed.trim(), view: input.view.trim() };
  writeManagementStore({ ...store, rooms: id ? store.rooms.map(item => item.id === id ? room : item) : [...store.rooms, room] });
  return room;
}

export function saveService(input: Omit<ServiceCategory, "id">, id?: string) {
  requireManager();
  const store = readManagementStore();
  const name = input.name.trim();
  const description = input.description.trim();
  if (!name || name.length > 60 || !description || description.length > 300) throw new Error("Enter a name and description.");
  if (id && !store.services.some(item => item.id === id)) throw new Error("Service not found.");
  if (store.services.some(item => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) throw new Error("A service with this name already exists.");
  const service = { ...input, id: id ?? crypto.randomUUID(), name, description };
  writeManagementStore({ ...store, services: id ? store.services.map(item => item.id === id ? service : item) : [...store.services, service] });
}

export function updateLoyaltyRule(pointsPerNight: number) {
  requireManager();
  if (!Number.isInteger(pointsPerNight) || pointsPerNight < 0 || pointsPerNight > 10000) throw new Error("Enter a whole number between 0 and 10,000.");
  const store = readManagementStore();
  writeManagementStore({ ...store, loyaltyRules: [...store.loyaltyRules, { pointsPerNight, effectiveAt: new Date().toISOString() }] });
}

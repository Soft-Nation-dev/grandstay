import { stayNights } from "@/lib/format";
import type { BookingInput } from "@/types/booking";

export function readStay(params: Pick<URLSearchParams, "get">) {
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const guests = Number(params.get("guests") ?? 2);
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  return validDate(checkIn) && validDate(checkOut) && stayNights(checkIn, checkOut) && Number.isInteger(guests) && guests >= 1 && guests <= 3 ? { checkIn, checkOut, guests } : undefined;
}

export function bookingQuery(input: BookingInput) {
  return new URLSearchParams({ room: input.roomId, checkIn: input.checkIn, checkOut: input.checkOut, guests: String(input.guests) }).toString();
}

export function checkoutReturn(value: string | null) {
  if (!value || !value.startsWith("/checkout?")) return null;
  const query = new URLSearchParams(value.slice(10));
  const stay = readStay(query);
  const roomId = query.get("room");
  return stay && roomId ? `/checkout?${bookingQuery({ ...stay, roomId })}` : null;
}

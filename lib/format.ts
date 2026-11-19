export const formatMoney = (amount: number) => `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;

export function localDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function stayNights(checkIn: string, checkOut: string) {
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

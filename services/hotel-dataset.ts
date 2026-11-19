import bookings from "@/data/hotel-dataset/bookings.json";
import guests from "@/data/hotel-dataset/guests.json";
import payments from "@/data/hotel-dataset/payments.json";
import serviceRequests from "@/data/hotel-dataset/service-requests.json";

export type RecordedBooking = (typeof bookings)[number];
export type RecordedService = (typeof serviceRequests)[number];
export type RecordedPayment = (typeof payments)[number];

export function getHotelDataset() {
  return { bookings, guests, payments, serviceRequests };
}

export function datasetGuestId(accountId: string) {
  return accountId === "demo-guest" ? "G0072" : undefined;
}

export function recordedBookings(guestId?: string) {
  return bookings.filter(item => !guestId || item.Guest_ID === guestId);
}

export function recordedServices(guestId?: string) {
  return serviceRequests.filter(item => !guestId || item.Guest_ID === guestId);
}

export function recordedPayment(bookingId: string) {
  return payments.find(item => item.Booking_ID === bookingId);
}

export function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function datasetMetrics() {
  const completed = bookings.filter(item => item.Booking_Status === "Completed");
  const successful = payments.filter(item => item.Payment_Status === "Successful");
  const sum = (rows: RecordedPayment[]) => rows.reduce((total, row) => total + row.Total_Revenue_NGN, 0);
  const months = [...new Set(payments.map(item => item.Booking_Date.slice(0, 7)))].sort().map(month => {
    const rows = successful.filter(item => item.Booking_Date.startsWith(month));
    return { month, revenue: sum(rows), count: rows.length };
  });
  const rooms = [...new Set(bookings.map(item => item.Room_Type))].sort().map(name => {
    const rows = bookings.filter(item => item.Room_Type === name);
    return { name, count: rows.length, averageRate: Math.round(average(rows.map(item => item.Nightly_Rate_NGN))) };
  });
  const services = [...new Set(serviceRequests.map(item => item.Service_Request_Type))].sort().map(name => {
    const rows = serviceRequests.filter(item => item.Service_Request_Type === name);
    return { name, count: rows.length, response: average(rows.map(item => item.Service_Response_Time_Min)), resolution: average(rows.map(item => item.Service_Resolution_Time_Min)), satisfaction: average(rows.map(item => item.Guest_Satisfaction_1_5)) };
  });
  const dates = bookings.map(item => item.Booking_Date).sort();
  return { total: bookings.length, completed: completed.length, revenue: sum(successful), paymentCount: payments.length, successful: successful.length, guests: new Set(guests.map(item => item.Guest_ID)).size, requests: serviceRequests.length, satisfaction: average(serviceRequests.map(item => item.Guest_Satisfaction_1_5)), response: average(serviceRequests.map(item => item.Service_Response_Time_Min)), resolution: average(serviceRequests.map(item => item.Service_Resolution_Time_Min)), returningBookings: bookings.filter(item => item.Returning_Guest === "Yes").length, bookingOutcomes: ["Completed", "Cancelled", "Abandoned"].map(name => ({ name, count: bookings.filter(item => item.Booking_Status === name).length })), paymentOutcomes: ["Successful", "Failed", "Pending", "Refunded"].map(name => ({ name, count: payments.filter(item => item.Payment_Status === name).length })), months, rooms, services, from: dates[0], to: dates.at(-1) };
}

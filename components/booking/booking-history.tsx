"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";
import type { Booking } from "@/types/booking";

function BookingCard({ booking, showGuest }: { booking: Booking; showGuest: boolean }) {
  return <article className="panel booking-card">
    <div className="booking-card-heading"><div><span className="eyebrow">{booking.id}</span><h3>{booking.roomName}</h3></div><span className="role-pill">Confirmed</span></div>
    {showGuest && <p className="muted">Guest: {booking.guestName}</p>}
    <div className="booking-dates"><span><Icon name="calendar" />{booking.checkIn} — {booking.checkOut}</span><span><Icon name="people" />{booking.guests} {booking.guests === 1 ? "guest" : "guests"}</span></div>
    <div className="booking-total"><span>Paid (demo)</span><strong>{formatMoney(booking.amount)}</strong></div>
    <p className="muted booking-reference">Payment reference: {booking.paymentReference}</p>
  </article>;
}

export function BookingHistory() {
  const { bookings, audit } = useBookingStore();
  const account = useAuth();
  const params = useSearchParams();
  if (!account) return null;
  const isGuest = account.role === "guest";
  const isManager = account.role === "manager";
  const visible = bookings.filter(booking => !isGuest || booking.guestId === account.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const confirmed = isGuest && visible.find(booking => booking.id === params.get("confirmed"));
  return <section className="workspace-section">
    <Link className="text-link" href={`/${account.role}`}><Icon name="back" /> Back to dashboard</Link>
    {confirmed && <div className="confirmation-panel" role="status"><span className="confirmation-icon"><Icon name="check" width={36} height={36} /></span><h2>Booking confirmed!</h2><p>Your demo payment was successful. Your reservation for {confirmed.roomName} is confirmed.</p><strong>{confirmed.id}</strong></div>}
    <div><span className="eyebrow">Reservations</span><h2>{isGuest ? "My bookings" : "Hotel bookings"}</h2><p className="muted">{visible.length} confirmed {visible.length === 1 ? "booking" : "bookings"} · browser-local demo data</p></div>
    {isManager && <div className="panel booking-total"><span>Total simulated payments</span><strong>{formatMoney(visible.reduce((sum, booking) => sum + booking.amount, 0))}</strong></div>}
    {visible.length ? <div className="workspace-grid">{visible.map(booking => <BookingCard key={booking.id} booking={booking} showGuest={!isGuest} />)}</div> : <div className="panel empty-state"><Icon name="calendar" width={32} height={32} /><h3>No confirmed bookings yet</h3><p>Bookings will appear here after a successful simulated payment.</p>{isGuest && <Link href="/rooms" className="button button-primary">Find a room</Link>}</div>}
    {isManager && <section className="panel team-panel"><h2>Booking &amp; payment activity</h2><p className="muted">Demo audit events. A secure, server-side audit log is required for production.</p><div className="audit-list">{audit.length ? [...audit].reverse().map(item => <div key={item.id}><strong>{item.event.replaceAll("_", " ")}</strong><span>{new Date(item.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC</span><small>{item.reference}</small></div>) : <p className="muted">No payment activity yet.</p>}</div></section>}
  </section>;
}

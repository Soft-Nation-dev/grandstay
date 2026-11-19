"use client";

import Link from "@/components/navigation/app-link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useExperience } from "@/hooks/use-experience";
import { hotelDate } from "@/services/experience";
import { stayPhase } from "@/lib/staff-operations";
import { Status } from "@/components/experience/shared";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";
import type { Booking } from "@/types/booking";

function BookingCard({ booking, showGuest, staff = false }: { booking: Booking; showGuest: boolean; staff?: boolean }) {
  const { checkIns } = useExperience();
  const checkIn = checkIns.find(item => item.bookingId === booking.id);
  return <article className="panel booking-card">
    <div className="booking-card-heading"><div><span className="eyebrow">{booking.id}</span><h3>{booking.roomName}</h3></div><span className="role-pill">Confirmed</span></div>
    {showGuest && <p className="muted">Guest: {booking.guestName}</p>}
    <div className="booking-dates"><span><Icon name="calendar" />{booking.checkIn} — {booking.checkOut}</span><span><Icon name="people" />{booking.guests} {booking.guests === 1 ? "guest" : "guests"}</span></div>
    <div className="booking-total"><span>Paid (test)</span><strong>{formatMoney(booking.amount)}</strong></div>
    <p className="muted booking-reference">Payment reference: {booking.paymentReference}</p>
    {staff && <div className="staff-booking-status"><span>Digital check-in</span>{checkIn ? <Status status={checkIn.status} /> : <span className="upcoming-label">Not submitted</span>}</div>}
    {staff && checkIn && <Link className="button button-soft" href={`/staff/check-ins?booking=${encodeURIComponent(booking.id)}`}>Review check-in <Icon name="arrow" /></Link>}
    {!showGuest && <Link className="button button-soft" href={`/guest/check-in?booking=${encodeURIComponent(booking.id)}`}>View digital check-in <Icon name="arrow" /></Link>}
  </article>;
}

export function BookingHistory() {
  const { bookings, audit } = useBookingStore();
  const account = useAuth();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  if (!account) return null;
  const isGuest = account.role === "guest";
  const isManager = account.role === "manager";
  const staff = account.role === "staff";
  const today = hotelDate();
  const requested = params.get("view");
  const view = ["today", "upcoming", "current", "past"].includes(requested ?? "") ? requested : "all";
  const focus = params.get("booking");
  const filtered = (booking: Booking) => (!focus || booking.id === focus) && (view === "all" || (view === "today" ? booking.checkIn === today : view === "upcoming" ? booking.checkIn >= today : stayPhase(booking, today) === view)) && `${booking.guestName} ${booking.roomName} ${booking.id}`.toLowerCase().includes(search.trim().toLowerCase());
  const visible = bookings.filter(booking => !isGuest || booking.guestId === account.id).filter(booking => !staff || filtered(booking)).sort((a, b) => staff ? a.checkIn.localeCompare(b.checkIn) || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt));
  const confirmed = isGuest && visible.find(booking => booking.id === params.get("confirmed"));
  return <section className="workspace-section">
    <Link className="text-link" href={`/${account.role}`}><Icon name="back" /> Back to dashboard</Link>
    {confirmed && <div className="confirmation-panel" role="status"><span className="confirmation-icon"><Icon name="check" width={36} height={36} /></span><h2>Booking confirmed!</h2><p>Your test payment was successful. Your reservation for {confirmed.roomName} is confirmed.</p><strong>{confirmed.id}</strong></div>}
    <div><span className="eyebrow">Reservations</span><h2>{isGuest ? "My bookings" : "Hotel bookings"}</h2><p className="muted">{visible.length} confirmed {visible.length === 1 ? "booking" : "bookings"}</p></div>
    {staff && <div className="panel staff-filter-panel"><div className="filter-tabs" aria-label="Reservation filters">{["all", "today", "upcoming", "current", "past"].map(item => <Link className={!focus && view === item ? "filter-active" : ""} aria-current={!focus && view === item ? "true" : undefined} href={item === "all" ? "/staff/bookings" : `/staff/bookings?view=${item}`} key={item}>{item === "all" ? "All" : item === "today" ? "Today" : item === "upcoming" ? "Upcoming" : item === "current" ? "Current stays" : "Past"}</Link>)}</div><label className="auth-field"><span>Search reservations</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Guest, room or booking reference" /></label>{focus && <Link className="text-link" href="/staff/bookings">Clear selected reservation</Link>}</div>}
    {isManager && <div className="panel booking-total"><span>Total payments</span><strong>{formatMoney(visible.reduce((sum, booking) => sum + booking.amount, 0))}</strong></div>}
    {visible.length ? <div className="workspace-grid">{visible.map(booking => <BookingCard key={booking.id} booking={booking} showGuest={!isGuest} staff={staff} />)}</div> : <div className="panel empty-state"><Icon name="calendar" width={32} height={32} /><h3>{staff ? "No matching reservations" : "No confirmed bookings yet"}</h3><p>{staff ? "Change the filter or search to see other reservations." : "Bookings will appear here after a successful payment."}</p>{isGuest && <Link href="/rooms" className="button button-primary">Find a room</Link>}</div>}
    {isManager && <section className="panel team-panel"><h2>Booking &amp; payment activity</h2><div className="audit-list">{audit.length ? [...audit].reverse().map(item => <div key={item.id}><strong>{item.event.replaceAll("_", " ")}</strong><span>{new Date(item.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC</span><small>{item.reference}</small></div>) : <p className="muted">No payment activity yet.</p>}</div></section>}
  </section>;
}

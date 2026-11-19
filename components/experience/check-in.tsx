"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { documentKinds } from "@/data/mock";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { useExperience } from "@/hooks/use-experience";
import { hotelDate, submitCheckIn, reviewCheckIn } from "@/services/experience";
import { Icon } from "@/components/ui/icon";
import { BookingPicker, EmptyExperience, ExperienceHeading, Status, formatMoment } from "@/components/experience/shared";
import type { Booking } from "@/types/booking";
import type { CheckIn, DocumentKind } from "@/types/experience";

function CheckInForm({ booking, current }: { booking: Booking; current?: CheckIn }) {
  const [sample, setSample] = useState(false);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      submitCheckIn({ bookingId: booking.id, arrivalTime: String(values.get("arrivalTime")), documentKind: values.get("documentKind") as DocumentKind, sampleSelected: sample });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to submit check-in.");
    }
  }
  return <form className="panel experience-form" onSubmit={submit}>
    <h3>Arrival details</h3>
    <div className="stay-facts"><span>{booking.guestName}</span><span>{booking.checkIn} — {booking.checkOut}</span><span>{booking.guests} guest(s)</span></div>
    {current?.reviewNote && <p className="auth-error">Review feedback: {current.reviewNote}</p>}
    <label className="auth-field"><span>Estimated arrival time (WAT)</span><input name="arrivalTime" type="time" defaultValue={current?.arrivalTime ?? "14:00"} required /></label>
    <label className="auth-field"><span>Identification type</span><select name="documentKind" defaultValue={current?.documentKind ?? documentKinds[0]}>{documentKinds.map(kind => <option key={kind}>{kind}</option>)}</select></label>
    <div className="sample-document"><Icon name="shield" width={30} height={30} /><div><strong>Sample identity document</strong><p>Fictional document for demonstration. No real ID or personal information is uploaded or stored.</p></div><button type="button" className="button button-soft" aria-pressed={sample} onClick={() => setSample(value => !value)}>{sample ? "Sample attached ✓" : "Attach sample"}</button></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="button button-primary" disabled={!sample} type="submit">Submit for review <Icon name="arrow" /></button>
  </form>;
}

export function GuestCheckIn() {
  const account = useAuth();
  const { bookings } = useBookingStore();
  const { checkIns } = useExperience();
  const params = useSearchParams();
  const [selected, setSelected] = useState("");
  const own = bookings.filter(item => item.guestId === account?.id && item.checkOut > hotelDate());
  const booking = own.find(item => item.id === (selected || params.get("booking"))) ?? own[0];
  const current = checkIns.find(item => item.bookingId === booking?.id && item.guestId === account?.id);
  return <section className="workspace-section"><ExperienceHeading role="guest" title="Digital check-in" description="Send your arrival details for front desk approval before your stay." />
    {!booking ? <EmptyExperience title="No upcoming reservations" description="Book a room first to access digital check-in."><Link href="/rooms" className="button button-primary">Explore rooms</Link></EmptyExperience> : <>
      <BookingPicker bookings={own} value={booking.id} onChange={setSelected} />
      {current && current.status !== "rejected" ? <div className="panel experience-form"><Status status={current.status} /><h3>{current.status === "approved" ? "Check-in approved" : "Your details are under review"}</h3><p className="muted">Submitted {formatMoment(current.submittedAt)}. {current.status === "pending" ? "The front desk will review your sample document." : "Your room access code is ready to view."}</p>{current.status === "approved" && <Link href="/guest/access" className="button button-primary">View room access</Link>}</div> : <CheckInForm key={booking.id} booking={booking} current={current} />}
    </>}
  </section>;
}

function ReviewCard({ item, booking }: { item: CheckIn; booking?: Booking }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  function review(approved: boolean) {
    setError("");
    try { reviewCheckIn(item.bookingId, approved, note); } catch (error) { setError(error instanceof Error ? error.message : "Unable to review submission."); }
  }
  return <article className="panel experience-form">
    <div className="booking-card-heading"><div><span className="eyebrow">{item.bookingId}</span><h3>{booking?.guestName ?? "Guest"}</h3></div><Status status={item.status} /></div>
    <p className="muted">{booking?.roomName} · Arrival {booking?.checkIn} at {item.arrivalTime} WAT</p>
    <div className="sample-id"><span>DEMO ONLY</span><Icon name="user" width={34} height={34} /><strong>{item.documentKind}</strong><small>Fictional identity sample · no real document stored</small></div>
    {item.status === "pending" ? <><label className="auth-field"><span>Review note (required for rejection)</span><textarea maxLength={300} value={note} onChange={event => setNote(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<div className="experience-actions"><button className="button button-primary" onClick={() => review(true)}>Approve check-in</button><button className="button button-soft" onClick={() => review(false)}>Reject</button></div></> : item.reviewNote && <p className="muted">{item.reviewNote}</p>}
  </article>;
}

export function StaffCheckIns() {
  const { bookings } = useBookingStore();
  const { checkIns } = useExperience();
  const sorted = [...checkIns].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending") || b.submittedAt.localeCompare(a.submittedAt));
  return <section className="workspace-section"><ExperienceHeading role="staff" title="Check-in queue" description="Review simulated identification submissions and approve or reject guest check-ins." /><p className="muted">{checkIns.filter(item => item.status === "pending").length} awaiting review</p>{sorted.length ? <div className="workspace-grid">{sorted.map(item => <ReviewCard key={item.bookingId} item={item} booking={bookings.find(booking => booking.id === item.bookingId)} />)}</div> : <EmptyExperience title="No submissions yet" description="Guest check-in submissions will appear here." />}</section>;
}

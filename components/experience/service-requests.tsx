"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { serviceCategories } from "@/data/mock";
import { useAuth, useAccounts } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { useExperience } from "@/hooks/use-experience";
import { activeStay, advanceRequest, createServiceRequest } from "@/services/experience";
import { Icon } from "@/components/ui/icon";
import { BookingPicker, EmptyExperience, ExperienceHeading, Status, statusLabels, formatMoment } from "@/components/experience/shared";
import type { ServiceRequest, RequestStatus } from "@/types/experience";

const sequence: RequestStatus[] = ["received", "in-progress", "done"];

function RequestCard({ request, guest, staff = false }: { request: ServiceRequest; guest?: string; staff?: boolean }) {
  const [error, setError] = useState("");
  function advance() {
    setError("");
    try { advanceRequest(request.id); } catch (error) { setError(error instanceof Error ? error.message : "Unable to update request."); }
  }
  return <article className="panel experience-form">
    <div className="booking-card-heading"><div><span className="eyebrow">{request.bookingId}</span><h3>{request.category}</h3></div><Status status={request.status} /></div>
    {guest && <p className="muted">Guest: {guest}</p>}
    {request.details && <p className="request-details">{request.details}</p>}
    <ol className="request-timeline">{sequence.map(status => {
      const history = request.history.find(item => item.status === status);
      return <li key={status} className={history ? "timeline-reached" : ""}><span className="timeline-dot">{history ? <Icon name="check" width={14} height={14} /> : ""}</span><div><strong>{statusLabels[status]}</strong><small>{history ? formatMoment(history.at) : "Awaiting update"}</small></div></li>;
    })}</ol>
    {staff && request.status !== "done" && <><button className="button button-primary" onClick={advance}>{request.status === "received" ? "Mark in progress" : "Mark done"}</button>{error && <p role="alert" className="auth-error">{error}</p>}</>}
  </article>;
}

export function GuestServices() {
  const account = useAuth();
  const { bookings } = useBookingStore();
  const { requests } = useExperience();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const active = bookings.filter(item => item.guestId === account?.id && activeStay(item));
  const booking = active.find(item => item.id === selected) ?? active[0];
  const own = requests.filter(item => item.guestId === account?.id).reverse();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    if (!booking) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      createServiceRequest(booking.id, String(data.get("category")), String(data.get("details") ?? ""));
      form.reset();
      setSuccess(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to submit request."); }
  }
  return <section className="workspace-section">
    <ExperienceHeading role="guest" title="Hotel services" description="Request assistance during your stay and follow the progress here." />
    {booking ? <form className="panel experience-form" onSubmit={submit}><h3>Request a service</h3><BookingPicker bookings={active} value={booking.id} onChange={setSelected} /><label className="auth-field"><span>Service category</span><select name="category">{serviceCategories.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="auth-field"><span>Request details (optional)</span><textarea name="details" placeholder="Tell us what you need…" maxLength={500} rows={3} /></label><p className="muted">Requests do not initiate a payment. Please use fictional information only.</p>{error && <p className="auth-error" role="alert">{error}</p>}{success && <p className="auth-notice" role="status"><Icon name="check" />Request received by the demo system.</p>}<button className="button button-primary" type="submit">Submit request <Icon name="arrow" /></button></form> : <EmptyExperience title="No active stay" description="Service requests become available during your reserved stay. You can contact the concierge at any time."><Link href="/guest/concierge" className="button button-soft">Contact concierge</Link></EmptyExperience>}
    <h3>My requests</h3>{own.length ? <div className="workspace-grid">{own.map(request => <RequestCard key={request.id} request={request} />)}</div> : <p className="muted">You haven’t submitted any service requests yet.</p>}
  </section>;
}

export function StaffServices() {
  const { requests } = useExperience();
  const accounts = useAccounts();
  const [filter, setFilter] = useState<"all" | RequestStatus>("all");
  const visible = requests.filter(item => filter === "all" || item.status === filter).reverse();
  return <section className="workspace-section"><ExperienceHeading role="staff" title="Service requests" description="Manage guest requests and keep their status up to date." /><div className="filter-tabs">{(["all", ...sequence] as const).map(status => <button key={status} aria-pressed={status === filter} className={status === filter ? "filter-active" : ""} onClick={() => setFilter(status)}>{status === "all" ? "All" : statusLabels[status]}</button>)}</div>{visible.length ? <div className="workspace-grid">{visible.map(request => <RequestCard key={request.id} request={request} guest={accounts.find(account => account.id === request.guestId)?.name ?? "Guest"} staff />)}</div> : <EmptyExperience title="No matching requests" description="Guest service requests will appear here." />}</section>;
}

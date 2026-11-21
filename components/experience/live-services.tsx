"use client";

import Link from "@/components/navigation/app-link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useManagement } from "@/hooks/use-management";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { useLiveCatalogue, useLiveRequests } from "@/hooks/use-services";
import { activeStay } from "@/services/experience";
import {
  advanceBackendServiceRequest, createBackendServiceRequest,
  loadMoreLiveRequests, refreshLiveRequests,
} from "@/services/backend-services";
import { Icon } from "@/components/ui/icon";
import { BookingPicker, EmptyExperience, ExperienceHeading, Status, statusLabels, formatMoment } from "@/components/experience/shared";
import type { ServiceRequest, RequestStatus } from "@/types/experience";

const sequence: RequestStatus[] = ["received", "in-progress", "done"];

function LiveRequestCard({ request, staff = false }: { request: ServiceRequest; staff?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function advance() {
    if (busy || request.status === "done") return;
    const next = request.status === "received" ? "in-progress" : "done";
    setBusy(true);
    setError("");
    try {
      await advanceBackendServiceRequest(request.id, next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the request.");
    } finally {
      setBusy(false);
    }
  }

  return <article className="panel experience-form">
    <div className="booking-card-heading"><div><span className="eyebrow">Booking {request.bookingId}</span><h3>{request.category}</h3></div><Status status={request.status} /></div>
    {staff && <p className="muted">Guest: {request.guestName || "Guest"} · {request.roomName || "Guestly room"}</p>}
    {request.details && <p className="request-details">{request.details}</p>}
    <ol className="request-timeline">{sequence.map(status => {
      const history = request.history.find(item => item.status === status);
      return <li key={status} className={history ? "timeline-reached" : ""}>
        <span className="timeline-dot">{history ? <Icon name="check" width={14} height={14} /> : ""}</span>
        <div><strong>{statusLabels[status]}</strong><small>{history ? formatMoment(history.at) : "Awaiting update"}</small></div>
      </li>;
    })}</ol>
    {staff && request.status !== "done" && <button type="button" className="button button-primary" disabled={busy} onClick={() => void advance()}>
      {busy ? "Saving…" : request.status === "received" ? "Mark in progress" : "Mark done"}
    </button>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </article>;
}

export function LiveGuestServices() {
  const account = useAuth();
  const { services } = useManagement();
  const catalogue = useLiveCatalogue();
  const { bookings, loading: bookingLoading } = useBookingStore();
  const { requests, total, loading, error: loadError } = useLiveRequests();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const categories = services.filter(item => item.active);
  const active = bookings.filter(item => item.guestId === account?.id && item.status === "confirmed" && activeStay(item));
  const booking = active.find(item => item.id === selected) || active[0];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!booking || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setSuccess(false);
    setBusy(true);
    try {
      await createBackendServiceRequest({
        bookingId: booking.id,
        categoryId: String(data.get("categoryId")),
        details: String(data.get("details") || ""),
      });
      form.reset();
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit the service request.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="workspace-section">
    <ExperienceHeading role="guest" title="Hotel services" description="Request assistance during your confirmed stay and track each update." />
    {(catalogue.loading || bookingLoading) && <p role="status">Loading hotel services and reservations…</p>}
    {catalogue.error && <p role="alert" className="auth-error">{catalogue.error}</p>}
    {booking ? <form className="panel experience-form" onSubmit={event => void submit(event)} aria-busy={busy}>
      <h3>Request a service</h3>
      <BookingPicker bookings={active} value={booking.id} onChange={setSelected} />
      <label className="auth-field"><span>Service category</span><select name="categoryId" required>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="auth-field"><span>Request details (optional)</span><textarea name="details" placeholder="Tell us what you need…" maxLength={500} rows={3} /></label>
      {!categories.length && <p className="muted">No services are currently available. You can contact the concierge for assistance.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {success && <p className="auth-notice" role="status"><Icon name="check" />Request received. Hotel staff will update its progress.</p>}
      <button type="submit" className="button button-primary" disabled={busy || !categories.length}>{busy ? "Sending request…" : "Submit request"} <Icon name="arrow" /></button>
    </form> : <EmptyExperience title="No active confirmed stay" description="Service requests are available only during your confirmed stay. You can still contact the concierge."><Link href="/guest/concierge" className="button button-soft">Contact concierge</Link></EmptyExperience>}
    <div className="staff-snapshot-heading"><h3>My requests</h3>
      {account?.role === "guest" && <button type="button" className="button button-soft" disabled={loading} onClick={() => void refreshLiveRequests(account, true)}>Refresh</button>}
    </div>
    {loading && <p role="status">Loading your service requests…</p>}
    {loadError && <p className="auth-error" role="alert">{loadError}</p>}
    {requests.length ? <div className="workspace-grid">{requests.map(item => <LiveRequestCard request={item} key={item.id} />)}</div> : <p className="muted">You haven&apos;t submitted any requests yet.</p>}
    {account?.role === "guest" && requests.length < total && <button type="button" className="button button-soft" disabled={loading} onClick={() => void loadMoreLiveRequests(account)}>Load earlier requests</button>}
  </section>;
}

export function LiveStaffServices() {
  const account = useAuth();
  const { requests, total, loading, error } = useLiveRequests();
  const params = useSearchParams();
  const focus = params.get("request");
  const filter = params.get("view") || "all";
  const visible = requests.filter(item =>
    (!focus || item.id === focus) &&
    (filter === "all" || filter === "open" && item.status !== "done" || item.status === filter),
  );
  return <section className="workspace-section">
    <ExperienceHeading role="staff" title="Service requests" description="Track guest requests and update their progress with the hotel team." />
    <div className="filter-tabs" aria-label="Service request filters">{(["all", "open", ...sequence] as const).map(status =>
      <Link key={status} aria-current={!focus && status === filter ? "true" : undefined} className={!focus && status === filter ? "filter-active" : ""}
        href={status === "all" ? "/staff/services" : "/staff/services?view=" + status}>{status === "all" ? "All" : status === "open" ? "Open" : statusLabels[status]}</Link>,
    )}</div>
    {focus && <Link className="text-link" href="/staff/services">Clear selected request</Link>}
    {loading && <p role="status">Loading service requests…</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {visible.length ? <div className="workspace-grid">{visible.map(item => <LiveRequestCard request={item} staff key={item.id} />)}</div> :
      <EmptyExperience title="No matching requests" description="Guest requests will appear here when submitted." />}
    {account?.role === "staff" && <div className="experience-actions">
      <button type="button" className="button button-soft" disabled={loading} onClick={() => void refreshLiveRequests(account, true)}>{loading ? "Refreshing…" : "Refresh requests"}</button>
      {requests.length < total && <button type="button" className="button button-soft" disabled={loading} onClick={() => void loadMoreLiveRequests(account)}>Load more requests</button>}
    </div>}
  </section>;
}

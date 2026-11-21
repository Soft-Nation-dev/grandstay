"use client";

import Link from "@/components/navigation/app-link";
import { RecordedServices } from "@/components/dataset/recorded-services";
import { datasetGuestId } from "@/services/hotel-dataset";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiConfigured } from "@/services/api-client";
import { LiveGuestServices, LiveStaffServices } from "@/components/experience/live-services";
import { useManagement } from "@/hooks/use-management";
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

function DemoGuestServices() {
  const account = useAuth();
  const importedGuest = account ? datasetGuestId(account.id) : undefined;
  const { services } = useManagement();
  const serviceCategories = services.filter(item => item.active);
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
    {booking ? <form className="panel experience-form" onSubmit={submit}><h3>Request a service</h3><BookingPicker bookings={active} value={booking.id} onChange={setSelected} /><label className="auth-field"><span>Service category</span><select name="category">{serviceCategories.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="auth-field"><span>Request details (optional)</span><textarea name="details" placeholder="Tell us what you need…" maxLength={500} rows={3} /></label>{!serviceCategories.length && <p className="muted">No services are currently available. Contact the concierge for assistance.</p>}{error && <p className="auth-error" role="alert">{error}</p>}{success && <p className="auth-notice" role="status"><Icon name="check" />Request received.</p>}<button className="button button-primary" type="submit" disabled={!serviceCategories.length}>Submit request <Icon name="arrow" /></button></form> : <EmptyExperience title="No active stay" description="Service requests become available during your reserved stay. You can contact the concierge at any time."><Link href="/guest/concierge" className="button button-soft">Contact concierge</Link></EmptyExperience>}
    <h3>My requests</h3>{own.length ? <div className="workspace-grid">{own.map(request => <RequestCard key={request.id} request={request} />)}</div> : <p className="muted">You haven’t submitted any service requests yet.</p>}
    {importedGuest && <RecordedServices guestId={importedGuest} />}
  </section>;
}

function DemoStaffServices() {
  const { requests } = useExperience();
  const accounts = useAccounts();
  const params = useSearchParams();
  const focus = params.get("request");
  const filter = params.get("view") ?? "all";
  const visible = requests.filter(item => (!focus || item.id === focus) && (filter === "all" || (filter === "open" ? item.status !== "done" : item.status === filter))).reverse();
  return <section className="workspace-section"><ExperienceHeading role="staff" title="Service requests" description="Manage guest requests and keep their status up to date." /><div className="filter-tabs" aria-label="Service request filters">{(["all", "open", ...sequence] as const).map(status => <Link key={status} aria-current={!focus && status === filter ? "true" : undefined} className={!focus && status === filter ? "filter-active" : ""} href={status === "all" ? "/staff/services" : `/staff/services?view=${status}`}>{status === "all" ? "All" : status === "open" ? "Open" : statusLabels[status]}</Link>)}</div>{focus && <Link className="text-link" href="/staff/services">Clear selected request</Link>}{visible.length ? <div className="workspace-grid">{visible.map(request => <RequestCard key={request.id} request={request} guest={accounts.find(account => account.id === request.guestId)?.name ?? "Guest"} staff />)}</div> : <EmptyExperience title="No matching requests" description="Guest service requests will appear here." />}{filter === "all" && !focus && <RecordedServices />}</section>;
}


export function GuestServices() {
  return apiConfigured() ? <LiveGuestServices /> : <DemoGuestServices />;
}

export function StaffServices() {
  return apiConfigured() ? <LiveStaffServices /> : <DemoStaffServices />;
}

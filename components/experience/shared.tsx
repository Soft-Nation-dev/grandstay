import Link from "@/components/navigation/app-link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import type { Booking } from "@/types/booking";
import type { CheckInStatus, RequestStatus } from "@/types/experience";

export const statusLabels: Record<CheckInStatus | RequestStatus, string> = { pending: "Pending review", approved: "Approved", rejected: "Rejected", received: "Received", "in-progress": "In progress", done: "Done" };

export function Status({ status }: { status: CheckInStatus | RequestStatus }) {
  return <span className={`experience-status status-${status}`}>{statusLabels[status]}</span>;
}

export function ExperienceHeading({ role, title, description }: { role: "guest" | "staff"; title: string; description: string }) {
  return <div className="experience-heading"><Link href={`/${role}`} className="text-link"><Icon name="back" /> Back to dashboard</Link><div><span className="eyebrow">GrandStay experience</span><h2>{title}</h2><p className="muted">{description}</p></div></div>;
}

export function BookingPicker({ bookings, value, onChange }: { bookings: Booking[]; value: string; onChange: (value: string) => void }) {
  return <label className="auth-field"><span>Reservation</span><select value={value} onChange={event => onChange(event.target.value)}>{bookings.map(booking => <option key={booking.id} value={booking.id}>{booking.roomName} · {booking.checkIn} · {booking.id}</option>)}</select></label>;
}

export function EmptyExperience({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="panel empty-state"><Icon name="info" width={30} height={30} /><h3>{title}</h3><p>{description}</p>{children}</div>;
}

export function formatMoment(value: string | number) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value));
}

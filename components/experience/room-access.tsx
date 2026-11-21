"use client";

import Link from "@/components/navigation/app-link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { useExperience } from "@/hooks/use-experience";
import { roomAccess } from "@/services/experience";
import { EmptyExperience, ExperienceHeading, formatMoment } from "@/components/experience/shared";
import { Icon } from "@/components/ui/icon";
import { apiConfigured } from "@/services/api-client";
import { LiveRoomAccess } from "@/components/experience/live-room-access";

function DemoRoomAccess() {
  const account = useAuth();
  const { bookings } = useBookingStore();
  const { checkIns } = useExperience();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);
  const own = bookings.filter(item => item.guestId === account?.id && checkIns.some(checkIn => checkIn.bookingId === item.id && checkIn.status === "approved"));
  return <section className="workspace-section"><ExperienceHeading role="guest" title="Digital room access" description="Your temporary access code is issued after the front desk approves your check-in." />
    {!own.length ? <EmptyExperience title="No access code yet" description="Complete digital check-in and wait for staff approval."><Link className="button button-primary" href="/guest/check-in">Go to check-in</Link></EmptyExperience> : <div className="workspace-grid">{own.map(booking => {
      const access = now ? roomAccess(booking, checkIns.find(item => item.bookingId === booking.id), now) : null;
      return <article className="panel access-card" key={booking.id}><span className="feature-icon"><Icon name="key" width={28} height={28} /></span><span className="eyebrow">{booking.id}</span><h3>{booking.roomName}</h3>{access && <><p className="access-code" aria-label="Temporary room access code">{access.code ?? "— — —"}</p><span className="role-pill">{access.status === "active" ? "Active" : access.status === "scheduled" ? "Scheduled" : access.status === "expired" ? "Expired" : "Unavailable"}</span><p className="muted">Valid from {formatMoment(access.validFrom)} until {formatMoment(access.expiresAt)} (WAT)</p></>}</article>;
    })}</div>}
  </section>;
}


export function RoomAccess() {
  return apiConfigured() ? <LiveRoomAccess /> : <DemoRoomAccess />;
}

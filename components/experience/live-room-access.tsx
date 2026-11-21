"use client";

import Link from "@/components/navigation/app-link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { useCheckIns } from "@/hooks/use-checkins";
import { getBackendAccess, type SimulatedAccess } from "@/services/backend-checkins";
import { EmptyExperience, ExperienceHeading, formatMoment } from "@/components/experience/shared";
import { Icon } from "@/components/ui/icon";

export function LiveRoomAccess() {
  const account = useAuth();
  const { bookings } = useBookingStore();
  const { checkIns, loading } = useCheckIns();
  const [accesses, setAccesses] = useState<Record<string, SimulatedAccess>>({});
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const own = bookings.filter(item => item.guestId === account?.id && item.status === "confirmed" &&
    checkIns.some(checkin => checkin.bookingId === item.id && checkin.status === "approved"));
  const ids = own.map(item => item.id).join("|");

  useEffect(() => {
    if (!account?.id || !ids) return;
    let active = true;
    async function refresh() {
      const bookingIds = ids.split("|");
      const results = await Promise.allSettled(bookingIds.map(getBackendAccess));
      if (!active) return;
      const next: Record<string, SimulatedAccess> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") next[bookingIds[index]] = result.value;
      });
      setAccesses(next);
      setNow(Date.now());
      const failure = results.find(result => result.status === "rejected");
      setError(failure && failure.status === "rejected" ? (failure.reason instanceof Error ? failure.reason.message : "Could not load simulated access.") : "");
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [account?.id, ids]);

  return <section className="workspace-section">
    <ExperienceHeading role="guest" title="Simulated room access" description="View a demonstration-only access code after staff approves your check-in." />
    <div className="panel auth-notice"><Icon name="shield" /><p>This is a simulation. These codes cannot unlock a physical door or room.</p></div>
    {loading && <p role="status">Loading approved check-ins…</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    {!own.length ? <EmptyExperience title="No approved check-in yet" description="A confirmed reservation and manual staff approval are required before simulated room access is available."><Link className="button button-primary" href="/guest/check-in">Go to check-in</Link></EmptyExperience> :
      <div className="workspace-grid">{own.map(booking => {
        const access = accesses[booking.id];
        const expired = Boolean(access?.expiresAt && now && now >= Date.parse(access.expiresAt));
        const active = access?.status === "active" && !expired;
        const status = expired ? "expired" : access?.status || "unavailable";
        return <article className="panel access-card" key={booking.id}>
          <span className="feature-icon"><Icon name="key" width={28} height={28} /></span>
          <span className="eyebrow">{booking.id}</span>
          <h3>{booking.roomName}</h3>
          <p className="access-code" aria-label="Simulated room access code">{active ? access?.code : "— — —"}</p>
          <span className="role-pill">{status === "active" ? "Active simulation" : status === "scheduled" ? "Scheduled" : status === "expired" ? "Expired" : "Unavailable"}</span>
          {access?.validFrom && access.expiresAt && <p className="muted">Valid from {formatMoment(access.validFrom)} until {formatMoment(access.expiresAt)} (WAT)</p>}
          <p className="muted">Not usable on real hotel locks.</p>
        </article>;
      })}</div>}
  </section>;
}

"use client";

import { useState, type FormEvent } from "react";
import { apiConfigured } from "@/services/api-client";
import { LiveLoyalty } from "@/components/management/live-loyalty";
import { datasetGuestId, recordedBookings } from "@/services/hotel-dataset";
import { useAuth } from "@/hooks/use-auth";
import { useBookingStore } from "@/hooks/use-bookings";
import { useExperience } from "@/hooks/use-experience";
import { useManagement } from "@/hooks/use-management";
import { updateLoyaltyRule } from "@/services/management";
import { loyaltyAwards } from "@/lib/management";
import { Icon } from "@/components/ui/icon";
import { formatMoment } from "@/components/experience/shared";

function DemoLoyalty({ manager = false }: { manager?: boolean }) {
  const account = useAuth();
  const { bookings } = useBookingStore();
  const { checkIns } = useExperience();
  const { loyaltyRules } = useManagement();
  const current = loyaltyRules.at(-1);
  const importedGuest = account ? datasetGuestId(account.id) : undefined;
  const history = manager || importedGuest ? recordedBookings(manager ? undefined : importedGuest).filter(item => item.Booking_Status === "Completed") : [];
  const awards = loyaltyAwards(bookings, checkIns, loyaltyRules).filter(item => manager || item.booking.guestId === account?.id);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    try { updateLoyaltyRule(Number(new FormData(event.currentTarget).get("points"))); setSuccess(true); } catch (error) { setError(error instanceof Error ? error.message : "Unable to save rule."); }
  }
  return <section className="workspace-section">
    <div><span className="eyebrow">Guestly loyalty</span><h2>{manager ? "Loyalty management" : "My loyalty points"}</h2><p className="muted">Points are earned on completed eligible stays.</p></div>
    <div className="workspace-grid"><div className="panel management-panel"><span className="feature-icon"><Icon name="people" /></span><p className="muted">{manager ? "Total points earned by guests" : "Your total points"}</p><strong className="loyalty-number">{awards.reduce((sum, item) => sum + item.points, 0).toLocaleString("en-NG")}</strong><p className="muted">{awards.length} eligible stays</p></div><div className="panel management-panel"><h3>Current earning rule</h3><strong className="loyalty-number">{current?.pointsPerNight ?? 0}</strong><p className="muted">Points per night</p>{manager && <form className="experience-form" onSubmit={submit} key={current?.effectiveAt}><label className="auth-field"><span>Points per night</span><input name="points" type="number" min={0} max={10000} required defaultValue={current?.pointsPerNight ?? 0} /></label>{error && <p role="alert" className="auth-error">{error}</p>}{success && <p role="status" className="auth-notice">Earning rule saved.</p>}<button type="submit" className="button button-primary">Save rule</button></form>}</div></div>
    <div className="panel management-panel"><h3>{manager ? "Guest awards" : "Points history"}</h3>{awards.length ? awards.map(item => <div className="management-stat" key={item.booking.id}><div><strong>{manager ? item.booking.guestName : item.booking.roomName}</strong><p className="muted">{item.booking.id} · {item.nights} nights · Checkout {item.booking.checkOut}</p></div><strong>+{item.points}</strong></div>) : <p className="muted">No eligible completed stays yet.</p>}</div>
    {history.length > 0 && <section className="panel management-panel"><h3>Recorded stay history</h3><div className="management-stat"><span>Bookings marked completed</span><strong>{history.length}</strong></div><div className="management-stat"><span>Recorded nights</span><strong>{history.reduce((sum, item) => sum + item.Stay_Length_Days, 0)}</strong></div><p className="muted">Points from imported stays are not credited until eligibility is verified.</p></section>}
    {manager && <section className="panel management-panel"><h3>Rule history</h3>{[...loyaltyRules].reverse().map(rule => <div className="management-stat" key={rule.effectiveAt}><span>{rule.effectiveAt.startsWith("1970") ? "Initial earning rule" : formatMoment(rule.effectiveAt)}</span><strong>{rule.pointsPerNight} pts/night</strong></div>)}</section>}
    
  </section>;
}


export function Loyalty({ manager = false }: { manager?: boolean }) {
  return apiConfigured() ? <LiveLoyalty manager={manager} /> : <DemoLoyalty manager={manager} />;
}

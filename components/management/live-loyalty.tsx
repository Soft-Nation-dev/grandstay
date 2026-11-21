"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLiveLoyalty } from "@/hooks/use-loyalty";
import {
  refreshLiveLoyalty, loadMoreLoyalty, saveLiveLoyaltyRule, reconcileLiveLoyalty,
} from "@/services/backend-loyalty";
import { Icon } from "@/components/ui/icon";
import { formatMoment } from "@/components/experience/shared";

export function LiveLoyalty({ manager = false }: { manager?: boolean }) {
  const account = useAuth();
  const { summary, rules, loading, error } = useLiveLoyalty();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const current = rules[rules.length - 1] || summary?.rules[0];
  const permitted = Boolean(account && (manager ? account.role === "manager" : account.role === "guest"));

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account || account.role !== "manager") return;
    setBusy(true);
    setNotice("");
    setFormError("");
    try {
      await saveLiveLoyaltyRule(account, Number(new FormData(event.currentTarget).get("points")));
      setNotice("The new rule will apply only to eligible stays checking out after this update.");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to update loyalty rules.");
    } finally {
      setBusy(false);
    }
  }

  async function reconcile() {
    if (!account || account.role !== "manager") return;
    setBusy(true);
    setNotice("");
    setFormError("");
    try {
      const result = await reconcileLiveLoyalty(account);
      setNotice(result.created + " new awards · " + result.revoked + " revoked awards · " + result.guestsChecked + " guest accounts checked.");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to reconcile eligible stays.");
    } finally {
      setBusy(false);
    }
  }

  if (!permitted) return null;
  return <section className="workspace-section">
    <div className="staff-snapshot-heading"><div>
      <span className="eyebrow">Guestly loyalty · verified stays only</span>
      <h2>{manager ? "Loyalty management" : "My loyalty points"}</h2>
      <p className="muted">Points are earned after checkout only when a confirmed booking has a matching successful Paystack payment and staff-approved check-in. Imported historical records never create points.</p>
    </div>{account && <button className="button button-soft" type="button" disabled={loading} onClick={() => void refreshLiveLoyalty(account, true)}>Refresh points</button>}</div>
    {loading && <p role="status">Loading verified loyalty information…</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="workspace-grid">
      <div className="panel management-panel"><span className="feature-icon"><Icon name="people" /></span>
        <p className="muted">{manager ? "Total active verified points" : "Your verified point balance"}</p>
        <strong className="loyalty-number">{(summary?.points ?? 0).toLocaleString("en-NG")}</strong>
        <p className="muted">{summary?.total ?? 0} recorded award entries, including reversals</p>
      </div>
      <div className="panel management-panel">
        <h3>Current earning rule</h3>
        <strong className="loyalty-number">{current?.pointsPerNight ?? 10}</strong>
        <p className="muted">Points per eligible night</p>
        {manager && account?.role === "manager" && <form className="experience-form" onSubmit={event => void saveRule(event)} key={current?.effectiveAt}>
          <label className="auth-field"><span>Points per night</span><input name="points" type="number" min={0} max={10000} required defaultValue={current?.pointsPerNight ?? 10} /></label>
          <button className="button button-primary" type="submit" disabled={busy}>Save future earning rule</button>
        </form>}
      </div>
    </div>
    {manager && <div className="panel management-panel">
      <h3>Verified-stay reconciliation</h3>
      <p className="muted">Reconcile completed stays with the booking, Paystack payment and staff check-in records. Existing awards remain idempotent.</p>
      <button className="button button-soft" type="button" disabled={busy} onClick={() => void reconcile()}>{busy ? "Reconciling…" : "Reconcile eligible stays"}</button>
    </div>}
    {formError && <p role="alert" className="auth-error">{formError}</p>}
    {notice && <p role="status" className="auth-notice">{notice}</p>}
    <div className="panel management-panel"><h3>{manager ? "Verified guest awards" : "My points history"}</h3>
      {summary?.awards.length ? summary.awards.map(item => <div className="management-stat" key={item.id}>
        <div><strong>{manager ? item.guestId : item.roomName}</strong>
          <p className="muted">Booking {item.bookingId} · {item.nights} nights · Checked out {item.checkoutDate} · {formatMoment(item.awardedAt)}</p>
          {item.revokedAt && <p className="muted">Revoked {formatMoment(item.revokedAt)} after eligibility changed</p>}
        </div>
        <strong>{item.revokedAt ? "0 (revoked)" : "+" + item.points}</strong>
      </div>) : <p className="muted">No verified completed and approved stays have earned points yet.</p>}
      {account && summary && summary.awards.length < summary.total && <button className="button button-soft" type="button" disabled={loading} onClick={() => void loadMoreLoyalty(account)}>Load older awards</button>}
    </div>
    {manager && <div className="panel management-panel"><h3>Earning rule history</h3>
      {rules.map(item => <div className="management-stat" key={item.effectiveAt}>
        <span>{item.effectiveAt.startsWith("1970") ? "Initial earning rule" : formatMoment(item.effectiveAt)}</span>
        <strong>{item.pointsPerNight} pts/night</strong>
      </div>)}
    </div>}
  </section>;
}

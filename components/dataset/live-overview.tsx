"use client";

import Link from "@/components/navigation/app-link";
import { useAuth } from "@/hooks/use-auth";
import { useManagerReport } from "@/hooks/use-reporting";
import { refreshManagerReport } from "@/services/backend-reporting";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/ui/icon";

const fraction = (amount: number, total: number) => total ? (100 * amount / total).toFixed(1) + "%" : "—";

export function LiveDatasetOverview() {
  const account = useAuth();
  const { report, loading, error } = useManagerReport();
  const historical = report?.historical;
  const live = report?.live;
  const maximum = Math.max(1, ...(historical?.months || []).map(item => item.revenue));
  return <section className="workspace-section">
    <div className="staff-snapshot-heading"><div><span className="eyebrow">Management reporting</span><h2>Verified live performance</h2>
      <p className="muted">Live metrics come only from operational bookings and backend-verified transactions.</p></div>
      {account?.role === "manager" && <button type="button" className="button button-soft" disabled={loading} onClick={() => void refreshManagerReport(account.id, true)}>{loading ? "Loading…" : "Refresh report"}</button>}
    </div>
    {loading && <p role="status">Loading management reports…</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    {live && <div className="staff-metrics">
      {[
        ["Confirmed live bookings", live.confirmedBookings, "Backend-confirmed reservations", "/manager/bookings"],
        ["Verified Paystack revenue", formatMoney(live.verifiedRevenueNGN), live.verifiedPayments + " successful payments", "/manager/bookings"],
        ["Completed service requests", live.completedServiceRequests, live.serviceRequests + " live requests total", "/manager/services"],
        ["Verified loyalty points", live.loyaltyPointsAwarded.toLocaleString("en-NG"), "Approved completed live stays only", "/manager/loyalty"],
      ].map(([name, value, hint, href]) => <Link key={name} className="panel staff-metric" href={String(href)}>
        <div>{name}<Icon name="chart" /></div><strong className="manager-metric-value">{value}</strong><small>{hint}</small>
      </Link>)}
    </div>}
    <div className="staff-snapshot-heading"><div><span className="eyebrow">Separate imported source</span><h2>Historical Data Analyst records</h2>
      <p className="muted">Original dataset statuses are preserved as reported. They are not gateway-verified payments or Guestly loyalty credits.</p></div></div>
    {!historical?.imported ? <div className="panel management-panel">
      <h3>Historical import pending</h3>
      <p className="muted">No historical source rows have been imported into the backend yet. The backend developer can validate and import them using the documented dry-run and apply commands.</p>
    </div> : <>
      <p className="muted">{historical.from} — {historical.to} · Source booking dates · {historical.counts.guests} guest rows, {historical.distinctGuestIds} distinct guest IDs</p>
      {historical.conflictingGuestIds > 0 && <p role="status" className="auth-notice">Data-quality note: {historical.conflictingGuestIds} guest IDs have conflicting historical profiles. No historical identity is automatically linked to a live guest.</p>}
      <div className="staff-metrics">
        {[
          ["Recorded bookings", historical.counts.bookings, (historical.completed || 0) + " marked completed", "/manager/bookings"],
          ["Historical successful payment value", formatMoney(historical.historicalSuccessfulRevenueNGN || 0), (historical.successfulPayments || 0) + " source-status successful (not Paystack verified)", "/manager/bookings"],
          ["Distinct recorded guest IDs", historical.distinctGuestIds, historical.counts.guests + " source guest rows", "/manager/loyalty"],
          ["Recorded guest satisfaction", (historical.satisfaction || 0).toFixed(1) + "/5", historical.counts.requests + " service records", "/manager/services"],
        ].map(([name, value, hint, href]) => <Link key={name} className="panel staff-metric" href={String(href)}>
          <div>{name}<Icon name="chart" /></div><strong className="manager-metric-value">{value}</strong><small>{hint}</small>
        </Link>)}
      </div>
      <div className="staff-operations-grid">
        <section className="panel management-panel">
          <h3>Recorded monthly payment value</h3>
          <div className="dataset-chart" aria-label="Historical payments marked Successful by source">
            {(historical.months || []).map(item => <div className="dataset-chart-row" key={item.month}>
              <span>{item.month}</span><div className="dataset-track"><span style={{ width: (item.revenue / maximum * 100) + "%" }} /></div><strong>{formatMoney(item.revenue)}</strong>
            </div>)}
          </div>
        </section>
        <section className="panel management-panel">
          <h3>Recorded booking outcomes</h3>
          {(historical.bookingOutcomes || []).map(item => <div className="management-stat" key={item.name}><span>{item.name}</span><strong>{item.count} · {fraction(item.count, historical.counts.bookings)}</strong></div>)}
          <h3>Recorded payment statuses</h3>
          {(historical.paymentOutcomes || []).map(item => <div className="management-stat" key={item.name}><span>{item.name}</span><strong>{item.count} · {fraction(item.count, historical.counts.payments)}</strong></div>)}
        </section>
        <section className="panel management-panel">
          <h3>Historical room categories</h3>
          {(historical.rooms || []).map(item => <div className="management-stat" key={item.name}><div><strong>{item.name}</strong><p className="muted">Average source rate: {formatMoney(item.averageRate)}</p></div><strong>{item.count}</strong></div>)}
        </section>
        <section className="panel management-panel">
          <h3>Historical service performance</h3>
          <div className="management-stat"><span>Average response time</span><strong>{(historical.response || 0).toFixed(1)} min</strong></div>
          <div className="management-stat"><span>Average resolution time</span><strong>{(historical.resolution || 0).toFixed(1)} min</strong></div>
          <Link href="/manager/services" className="text-link">Browse original service records <Icon name="arrow" /></Link>
        </section>
      </div>
    </>}
  </section>;
}

export function LiveDatasetServiceStats() {
  const { report, loading, error } = useManagerReport();
  const historical = report?.historical;
  if (loading) return <p role="status">Loading recorded service performance…</p>;
  if (error) return <p role="alert" className="auth-error">{error}</p>;
  if (!historical?.imported) return <p className="muted">Historical service performance is not imported yet.</p>;
  return <section className="panel management-panel dataset-section">
    <span className="eyebrow">Original historical source · not live</span>
    <h2>Recorded service performance</h2>
    <p className="muted">{historical.counts.requests} source requests · {(historical.satisfaction || 0).toFixed(1)}/5 average satisfaction</p>
    {(historical.services || []).map(item => <div key={item.name} className="management-stat">
      <div><strong>{item.name}</strong><p className="muted">Response {item.response.toFixed(1)} min · Resolution {item.resolution.toFixed(1)} min · Satisfaction {item.satisfaction.toFixed(1)}/5</p></div><strong>{item.count}</strong>
    </div>)}
  </section>;
}

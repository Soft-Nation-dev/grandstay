import Link from "@/components/navigation/app-link";
import { datasetMetrics } from "@/services/hotel-dataset";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/ui/icon";

const metrics = datasetMetrics();
const percentage = (value: number, total: number) => total ? `${(value / total * 100).toFixed(1)}%` : "—";

export function DatasetOverview() {
  const maximum = Math.max(1, ...metrics.months.map(item => item.revenue));
  const cards = [
    { title: "Recorded bookings", value: metrics.total, hint: `${metrics.completed} completed · ${percentage(metrics.completed, metrics.total)}`, href: "/manager/bookings" },
    { title: "Successful payment revenue", value: formatMoney(metrics.revenue), hint: `${metrics.successful} successful payments`, href: "/manager/bookings" },
    { title: "Recorded guests", value: metrics.guests, hint: `${metrics.returningBookings} returning-guest bookings`, href: "/manager/loyalty" },
    { title: "Guest satisfaction", value: `${metrics.satisfaction.toFixed(1)}/5`, hint: `${metrics.requests} service records`, href: "/manager/services" },
  ];
  return <section className="workspace-section"><div><span className="eyebrow">Hotel records</span><h2>Performance overview</h2><p className="muted">{metrics.from} — {metrics.to} · Booking dates</p></div>
    <div className="staff-metrics">{cards.map(item => <Link href={item.href} className="panel staff-metric" key={item.title}><div>{item.title}<Icon name="chart" /></div><strong className="manager-metric-value">{item.value}</strong><small>{item.hint}</small></Link>)}</div>
    <div className="staff-operations-grid">
      <section className="panel management-panel"><div className="staff-section-heading"><h2>Monthly revenue</h2><Link className="text-link" href="/manager/bookings">Records <Icon name="arrow" /></Link></div><div className="dataset-chart" aria-label="Monthly revenue from successful payments">{metrics.months.map(item => <div key={item.month} className="dataset-chart-row"><span>{item.month}</span><div className="dataset-track"><span style={{ width: `${item.revenue / maximum * 100}%` }} /></div><strong>{formatMoney(item.revenue)}</strong></div>)}</div></section>
      <section className="panel management-panel"><h2>Booking outcomes</h2>{metrics.bookingOutcomes.map(item => <div className="management-stat" key={item.name}><span>{item.name}</span><strong>{item.count} · {percentage(item.count, metrics.total)}</strong></div>)}<h2>Payment outcomes</h2>{metrics.paymentOutcomes.map(item => <div className="management-stat" key={item.name}><span>{item.name}</span><strong>{item.count} · {percentage(item.count, metrics.paymentCount)}</strong></div>)}</section>
      <section className="panel management-panel"><h2>Room type performance</h2>{metrics.rooms.map(item => <div className="management-stat" key={item.name}><div><strong>{item.name}</strong><p className="muted">Recorded average rate: {formatMoney(item.averageRate)}</p></div><strong>{item.count}</strong></div>)}</section>
      <section className="panel management-panel"><h2>Service performance</h2><div className="management-stat"><span>Average response</span><strong>{metrics.response.toFixed(1)} min</strong></div><div className="management-stat"><span>Average resolution</span><strong>{metrics.resolution.toFixed(1)} min</strong></div><Link className="text-link" href="/manager/services">View service records <Icon name="arrow" /></Link></section>
    </div>
  </section>;
}

export function DatasetServiceStats() {
  return <section className="panel management-panel dataset-section"><div><span className="eyebrow">Hotel records</span><h2>Recorded service performance</h2><p className="muted">{metrics.requests} requests · {metrics.satisfaction.toFixed(1)}/5 average satisfaction</p></div>{metrics.services.map(item => <div className="management-stat" key={item.name}><div><strong>{item.name}</strong><p className="muted">Response: {item.response.toFixed(1)} min · Resolution: {item.resolution.toFixed(1)} min · {item.satisfaction.toFixed(1)}/5</p></div><strong>{item.count}</strong></div>)}</section>;
}

export function DatasetStaffSummary() {
  return <section className="panel management-panel"><div><span className="eyebrow">Hotel records</span><h2>Reservation and service history</h2></div><div className="management-stat"><div><strong>{metrics.total} booking records</strong><p className="muted">{metrics.completed} marked completed</p></div><Link className="text-link" href="/staff/bookings">Bookings <Icon name="arrow" /></Link></div><div className="management-stat"><div><strong>{metrics.requests} service records</strong><p className="muted">Average response: {metrics.response.toFixed(1)} min</p></div><Link className="text-link" href="/staff/services">Services <Icon name="arrow" /></Link></div></section>;
}

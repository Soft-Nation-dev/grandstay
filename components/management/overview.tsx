"use client";

import Link from "@/components/navigation/app-link";
import { useBookingStore } from "@/hooks/use-bookings";
import { useExperience } from "@/hooks/use-experience";
import { useManagement } from "@/hooks/use-management";
import { bookingMetrics, serviceMetrics } from "@/lib/management";
import { formatMoney } from "@/lib/format";
import { hotelDate } from "@/services/experience";
import { Icon, type IconName } from "@/components/ui/icon";

export function ManagerOverview() {
  const { bookings, audit } = useBookingStore();
  const { requests } = useExperience();
  const { rooms } = useManagement();
  const booking = bookingMetrics(bookings, audit);
  const service = serviceMetrics(requests);
  const today = hotelDate();
  const inventory = rooms.reduce((total, item) => total + item.inventory, 0);
  const occupied = bookings.filter(item => item.checkIn <= today && item.checkOut > today).length;
  const metrics: { title: string; value: string | number; hint: string; icon: IconName; href: string }[] = [
    { title: "Confirmed bookings", value: booking.total, hint: "All confirmed reservations", icon: "calendar", href: "/manager/bookings" },
    { title: "Booking revenue", value: formatMoney(booking.revenue), hint: "Verified payments", icon: "chart", href: "/manager/bookings" },
    { title: "Rooms reserved today", value: inventory ? `${occupied}/${inventory}` : "—", hint: "Reservation-based, not physical occupancy", icon: "bed", href: "/manager/rooms" },
    { title: "Service completion", value: service.completion === null ? "—" : `${service.completion}%`, hint: `${service.done} of ${service.total} requests done`, icon: "list", href: "/manager/services" },
  ];
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 6 + index);
    const day = date.toISOString().slice(0, 10);
    const items = bookings.filter(item => hotelDate(new Date(item.createdAt)) === day);
    return { day, total: items.reduce((sum, item) => sum + item.amount, 0), count: items.length };
  });
  const maximum = Math.max(1, ...days.map(item => item.total));
  return <div className="staff-overview">
    <div className="staff-snapshot-heading"><div><span className="eyebrow">Hotel management</span><h2>Performance overview</h2></div><span className="staff-date"><Icon name="calendar" />{today} · WAT</span></div>
    <div className="staff-metrics">{metrics.map(item => <Link className="panel staff-metric" href={item.href} key={item.title}><div><span>{item.title}</span><Icon name={item.icon} /></div><strong className="manager-metric-value">{item.value}</strong><small>{item.hint}</small></Link>)}</div>
    <div className="staff-operations-grid">
      <section className="panel management-panel"><div className="staff-section-heading"><h2>Revenue · last 7 days</h2><Link className="text-link" href="/manager/bookings">Payments <Icon name="arrow" /></Link></div><div className="revenue-chart" aria-label="Revenue by booking date">{days.map(item => <div key={item.day} aria-label={`${item.day}: ${formatMoney(item.total)}, ${item.count} bookings`} title={`${item.day}: ${formatMoney(item.total)}`}><span>{item.count}</span><div className="revenue-track"><div style={{ height: `${item.total / maximum * 100}%` }} /></div><small>{item.day.slice(5)}</small></div>)}</div><p className="muted">Bars show payment amounts by booking date; labels show booking counts.</p></section>
      <section className="panel management-panel"><div className="staff-section-heading"><h2>Payment outcomes</h2><Link className="text-link" href="/manager/bookings">Audit log <Icon name="arrow" /></Link></div><div className="management-stat"><span>Recorded attempts</span><strong>{booking.attempts}</strong></div><div className="management-stat"><span>Verified payments</span><strong>{booking.verified}</strong></div><div className="management-stat"><span>Attempt success rate</span><strong>{booking.conversion === null ? "—" : `${booking.conversion}%`}</strong></div></section>
      <section className="panel management-panel"><div className="staff-section-heading"><h2>Service activity</h2><Link className="text-link" href="/manager/services">View performance <Icon name="arrow" /></Link></div>{[["Received", service.received], ["In progress", service.inProgress], ["Done", service.done]].map(([label, value]) => <div className="management-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
      <section className="panel management-panel"><div className="staff-section-heading"><h2>Hotel configuration</h2></div><Link className="management-stat" href="/manager/rooms"><span>Room catalogue</span><Icon name="arrow" /></Link><Link className="management-stat" href="/manager/services"><span>Service catalogue</span><Icon name="arrow" /></Link><Link className="management-stat" href="/manager/loyalty"><span>Loyalty rules</span><Icon name="arrow" /></Link></section>
    </div>
  </div>;
}

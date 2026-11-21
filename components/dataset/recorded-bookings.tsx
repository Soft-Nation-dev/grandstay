"use client";

import { useState } from "react";
import { apiConfigured } from "@/services/api-client";
import { LiveHistoricalRecords } from "@/components/dataset/live-historical";
import { recordedBookings, recordedPayment } from "@/services/hotel-dataset";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/ui/icon";

const pageSize = 10;

function DemoRecordedBookings({ guestId, manager = false }: { guestId?: string; manager?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const rows = recordedBookings(guestId).filter(item => (status === "all" || item.Booking_Status === status) && [item.Booking_ID, item.Guest_ID, item.Room_Type, item.Booking_Channel].join(" ").toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => b.Booking_Date.localeCompare(a.Booking_Date));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  return <section className="panel management-panel dataset-section">
    <div><span className="eyebrow">Hotel records</span><h2>{guestId ? "Previous reservations" : "Imported booking records"}</h2><p className="muted">{recordedBookings(guestId).length} source records · {guestId ? "Linked sample guest " + guestId : "Original booking and payment statuses"}</p></div>
    {!guestId && <div className="management-form-grid"><label className="auth-field"><span>Find a recorded booking</span><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Booking ID, guest ID or room type" /></label><label className="auth-field"><span>Booking status</span><select value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="all">All statuses</option>{["Completed", "Cancelled", "Abandoned"].map(item => <option key={item}>{item}</option>)}</select></label></div>}
    <div className="dataset-record-grid">{rows.slice(page * pageSize, (page + 1) * pageSize).map(item => {
      const payment = recordedPayment(item.Booking_ID);
      return <article className="dataset-record" key={item.Booking_ID}><div className="booking-card-heading"><div><span className="eyebrow">{item.Booking_ID}{!guestId && " · " + item.Guest_ID}</span><h3>{item.Room_Type}</h3></div><span className={`experience-status ${item.Booking_Status === "Completed" ? "status-approved" : "status-rejected"}`}>{item.Booking_Status}</span></div><p className="muted">{item.Check_In} — {item.Check_Out} · {item.Stay_Length_Days} nights</p><p className="muted">{item.Guest_Segment} · {item.Booking_Channel} · Booked {item.Booking_Date}</p><div className="booking-total"><span>{payment?.Payment_Status ?? item.Payment_Status}</span><strong>{formatMoney(payment?.Total_Revenue_NGN ?? item.Total_Revenue_NGN)}</strong></div>{manager && <><p className="muted">Payment ID: {payment?.Payment_ID ?? "—"}</p><p className="muted">Room: {formatMoney(item.Room_Revenue_NGN)} · Other: {formatMoney(item.Additional_Service_Revenue_NGN)}</p></>}</article>;
    })}</div>
    {!rows.length && <p className="muted">No matching records.</p>}
    {pages > 1 && <div className="dataset-pagination"><button type="button" className="button button-soft" disabled={page === 0} onClick={() => setPage(value => value - 1)}><Icon name="back" /> Previous</button><span role="status">Page {page + 1} of {pages}</span><button type="button" className="button button-soft" disabled={page + 1 >= pages} onClick={() => setPage(value => value + 1)}>Next <Icon name="arrow" /></button></div>}
  </section>;
}


export function RecordedBookings({ guestId, manager = false }: { guestId?: string; manager?: boolean }) {
  return apiConfigured() ? manager ? <LiveHistoricalRecords source="bookings" /> : null : <DemoRecordedBookings guestId={guestId} manager={manager} />;
}

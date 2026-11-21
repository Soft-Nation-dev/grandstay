"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchHistoricalRecords, type HistoricalPage, type HistoricalSource } from "@/services/backend-reporting";
import { formatMoney } from "@/lib/format";
import { Icon } from "@/components/ui/icon";

export function LiveHistoricalRecords({ source }: { source: HistoricalSource }) {
  const account = useAuth();
  const managerId = account?.role === "manager" ? account.id : "";
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<HistoricalPage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!managerId) return;
    let current = true;
    fetchHistoricalRecords(source, { page, limit: 10, q: search, status }).then(result => {
      if (current) { setData(result); setError(""); }
    }).catch(cause => {
      if (current) { setError(cause instanceof Error ? cause.message : "Unable to retrieve imported records."); setData(null); }
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [managerId, source, page, search, status]);

  if (!managerId) return null;
  const bookingSource = source === "bookings";
  const serviceSource = source === "service-requests";
  return <section className="panel management-panel dataset-section">
    <div><span className="eyebrow">Original Data Analyst dataset · archive only</span>
      <h2>{bookingSource ? "Imported booking records" : serviceSource ? "Imported service records" : "Imported " + source}</h2>
      <p className="muted">{data?.total ?? "—"} original source rows. These are not verified Guestly reservations, Paystack transactions or loyalty awards.</p></div>
    <form className="management-form-grid" onSubmit={event => { event.preventDefault(); setPage(1); setSearch(q); }}>
      <label className="auth-field"><span>Search original source ID</span><input value={q} onChange={event => setQ(event.target.value)} maxLength={40} placeholder={bookingSource ? "B0001" : serviceSource ? "SR0001" : "Original ID"} /></label>
      {(bookingSource || source === "payments") && <label className="auth-field"><span>Recorded status</span><select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
        <option value="">All statuses</option>
        {(bookingSource ? ["Completed", "Cancelled", "Abandoned"] : ["Successful", "Failed", "Pending", "Refunded"]).map(item => <option key={item}>{item}</option>)}
      </select></label>}
      <button type="submit" className="button button-soft">Search</button>
    </form>
    {loading && <p role="status">Loading historical source records…</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    {data && <div className="dataset-record-grid">{data.items.map(item => {
      const id = String(bookingSource ? item.Booking_ID : serviceSource ? item.Request_ID : item.sourceId);
      const title = bookingSource ? item.Room_Type : serviceSource ? item.Service_Request_Type : item.sourceId;
      return <article className="dataset-record" key={source + ":" + item.sourceRow}>
        <span className="eyebrow">{id} · Source row {item.sourceRow}</span>
        <h3>{title}</h3>
        <p className="muted">{bookingSource ? item.Check_In + " — " + item.Check_Out : serviceSource ? item.Request_Date : ""}</p>
        {bookingSource && <>
          <p className="muted">Guest {item.Guest_ID} · {item.Booking_Channel} · {item.Booking_Status}</p>
          <div className="booking-total"><span>Recorded payment: {item.Payment_Status}</span><strong>{formatMoney(Number(item.Total_Revenue_NGN))}</strong></div>
        </>}
        {serviceSource && <>
          <p className="muted">Booking {item.Booking_ID} · Guest {item.Guest_ID}</p>
          <div className="dataset-facts"><span>Response <strong>{item.Service_Response_Time_Min} min</strong></span><span>Resolution <strong>{item.Service_Resolution_Time_Min} min</strong></span><span>Satisfaction <strong>{item.Guest_Satisfaction_1_5}/5</strong></span></div>
        </>}
        {!bookingSource && !serviceSource && <p className="muted">Original source ID {item.sourceId}</p>}
      </article>;
    })}</div>}
    {data && !data.items.length && <p className="muted">No matching historical records; if the import has not run, historical data will remain empty.</p>}
    {data && data.total > 10 && <div className="dataset-pagination">
      <button className="button button-soft" type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}><Icon name="back" /> Previous</button>
      <span>Page {page} of {Math.max(1, Math.ceil(data.total / 10))}</span>
      <button className="button button-soft" type="button" disabled={page * 10 >= data.total || loading} onClick={() => setPage(value => value + 1)}>Next <Icon name="arrow" /></button>
    </div>}
  </section>;
}

"use client";

import { useState } from "react";
import { recordedServices } from "@/services/hotel-dataset";
import { Icon } from "@/components/ui/icon";

const pageSize = 10;

export function RecordedServices({ guestId }: { guestId?: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);
  const source = recordedServices(guestId);
  const categories = [...new Set(source.map(item => item.Service_Request_Type))].sort();
  const rows = source.filter(item => (category === "all" || item.Service_Request_Type === category) && [item.Request_ID, item.Booking_ID, item.Guest_ID, item.Service_Request_Type].join(" ").toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => b.Request_Date.localeCompare(a.Request_Date));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  return <section className="panel management-panel dataset-section"><div><span className="eyebrow">Hotel records</span><h2>{guestId ? "Previous service requests" : "Imported service records"}</h2><p className="muted">{source.length} recorded requests · Recorded response and resolution times</p></div>
    {!guestId && <div className="management-form-grid"><label className="auth-field"><span>Find a recorded request</span><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Request, booking or guest ID" /></label><label className="auth-field"><span>Service type</span><select value={category} onChange={event => { setCategory(event.target.value); setPage(0); }}><option value="all">All service types</option>{categories.map(item => <option key={item}>{item}</option>)}</select></label></div>}
    <div className="dataset-record-grid">{rows.slice(page * pageSize, (page + 1) * pageSize).map(item => <article className="dataset-record" key={item.Request_ID}><span className="eyebrow">{item.Request_ID} · {item.Booking_ID}{!guestId && " · " + item.Guest_ID}</span><h3>{item.Service_Request_Type}</h3><p className="muted">{item.Request_Date}</p><div className="dataset-facts"><span>Response <strong>{item.Service_Response_Time_Min} min</strong></span><span>Resolution <strong>{item.Service_Resolution_Time_Min} min</strong></span><span>Satisfaction <strong>{item.Guest_Satisfaction_1_5}/5</strong></span></div></article>)}</div>
    {!rows.length && <p className="muted">No matching records.</p>}
    {pages > 1 && <div className="dataset-pagination"><button type="button" className="button button-soft" disabled={page === 0} onClick={() => setPage(value => value - 1)}><Icon name="back" /> Previous</button><span role="status">Page {page + 1} of {pages}</span><button type="button" className="button button-soft" disabled={page + 1 >= pages} onClick={() => setPage(value => value + 1)}>Next <Icon name="arrow" /></button></div>}
  </section>;
}

"use client";

import Image from "@/components/ui/hotel-image";
import Link from "@/components/navigation/app-link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { RoomCard } from "@/components/public/room-card";
import { StaySearch } from "@/components/public/stay-search";
import { useManagement } from "@/hooks/use-management";
import { useBookingStore } from "@/hooks/use-bookings";
import { bookingQuery, readStay } from "@/lib/booking-query";
import type { Booking } from "@/types/booking";
import { formatMoney, localDate, stayNights } from "@/lib/format";
import { availableInventory, findRooms, getRoom } from "@/services/rooms";
import type { Room, StaySearch as Search } from "@/types/hotel";

const categories = ["All", "Standard", "Deluxe", "Executive"] as const;

function RoomDetail({ room, stay, back, bookings }: { room: Room; stay?: Search; back: string; bookings: Booking[] }) {
  const nights = stay ? stayNights(stay.checkIn, stay.checkOut) : 0;
  const available = stay && stay.checkIn >= localDate() && stay.guests <= room.capacity && availableInventory(room, stay, bookings) > 0;

  return <div className="detail-page">
    <Link className="text-link" href={back}><Icon name="back" /> All rooms</Link>
    <div className="page-heading"><span className="eyebrow">{room.category} · {room.view}</span><h1>{room.name}</h1><p>{room.description}</p></div>
    <div className="detail-grid">
      <div className="detail-main">
        <div className="detail-photo"><Image src={room.image} alt={room.name} fill sizes="(max-width: 800px) 100vw, 60vw" unoptimized={room.image.startsWith("data:")} priority /></div>
        <section className="panel detail-info"><h2>About this room</h2>
          <div className="room-meta"><span><Icon name="bed" />{room.bed}</span><span><Icon name="people" />Up to {room.capacity} guests</span><span>{room.size} m²</span></div>
          <div className="detail-amenities">{room.amenities.map((amenity) => <span key={amenity}><Icon name="check" />{amenity}</span>)}</div>
        </section>
      </div>
      <aside className="panel detail-booking">
        <span className="eyebrow">Plan your stay</span><h2><span className="price">{formatMoney(room.nightlyRate)}</span> <small>/ night</small></h2>
        <StaySearch key={JSON.stringify(stay)} initial={stay} roomId={room.id} />
        {stay && <div className="availability-result" role="status">{available ?
          <><span className="availability-label"><Icon name="check" /> Available for your dates</span><div className="estimate"><span>{nights} {nights === 1 ? "night" : "nights"}</span><strong>{formatMoney(room.nightlyRate * nights)}</strong></div><Link className="button button-primary" href={`/checkout?${bookingQuery({ ...stay, roomId: room.id })}`}>Reserve room <Icon name="arrow" /></Link></> :
          <p className="form-error">This room does not accommodate your selected stay. Try other dates or fewer guests.</p>}</div>}
      </aside>
    </div>
  </div>;
}

export function RoomBrowser() {
  const params = useSearchParams();
  const { bookings } = useBookingStore();
  const { rooms } = useManagement();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [sort, setSort] = useState("recommended");
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const nights = stayNights(checkIn, checkOut);
  const requestedStay = readStay(params);
  const stay = requestedStay && requestedStay.checkIn >= localDate() ? requestedStay : undefined;
  const roomId = params.get("room");
  const query = new URLSearchParams();
  if (stay) Object.entries(stay).forEach(([key, value]) => query.set(key, String(value)));
  const queryString = query.toString();
  const back = queryString ? `/rooms?${queryString}` : "/rooms";
  const room = roomId ? getRoom(roomId, rooms) : undefined;
  if (room) return <RoomDetail room={room} stay={stay} back={back} bookings={bookings} />;

  const matches = (stay ? findRooms(stay, bookings, rooms) : rooms).filter((item) => category === "All" || item.category === category);
  const results = [...matches].sort((a, b) => sort === "price-low" ? a.nightlyRate - b.nightlyRate : sort === "price-high" ? b.nightlyRate - a.nightlyRate : 0);
  return <>
    <div className="page-heading"><span className="eyebrow">Stay at Guestly</span><h1>Rooms &amp; suites</h1><p>Find a space to make your own, with the comforts that matter most.</p></div>
    {roomId && <p className="form-error" role="alert">We could not find that room. Explore our available rooms below.</p>}
    <section className="panel search-panel" aria-label="Find rooms"><StaySearch key={queryString} initial={stay} /></section>
    {!!(checkIn || checkOut) && !stay && <p className="form-error" role="alert">Enter valid dates and guest count to check availability.</p>}
    <div className="results-toolbar">
      <div className="filter-tabs" aria-label="Room categories">{categories.map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? "filter-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <label className="sort-field"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
    </div>
    <div className="results-heading"><p role="status">{results.length} {results.length === 1 ? "room type" : "room types"} {stay ? "available" : "to explore"}{stay && ` · ${nights} ${nights === 1 ? "night" : "nights"}`}</p>{stay && <Link className="text-link" href="/rooms">Clear dates</Link>}</div>
    {results.length ? <div className="room-grid">{results.map((item) => <RoomCard key={item.id} room={item} query={queryString} nights={stay ? nights : 0} />)}</div> :
      <div className="panel empty-state"><Icon name="bed" width={32} height={32} /><h2>No matching rooms</h2><p>Try a different date, guest count or room category.</p><button type="button" className="button button-soft" onClick={() => { setCategory("All"); setSort("recommended"); }}>Reset filters</button></div>}
  </>;
}

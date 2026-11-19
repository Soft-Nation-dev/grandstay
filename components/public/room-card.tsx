import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/format";
import type { Room } from "@/types/hotel";

export function RoomCard({ room, query, nights = 0 }: { room: Room; query?: string; nights?: number }) {
  const params = new URLSearchParams(query);
  params.set("room", room.id);
  return <article className="room-card">
    <div className="room-photo"><Image src={room.image} alt={room.name} fill unoptimized={room.image.startsWith("data:")} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /><span className="photo-tag">{room.category}</span></div>
    <div className="room-content">
      <span className="eyebrow">{room.view} · {room.size} m²</span>
      <h3>{room.name}</h3>
      <div className="room-meta"><span><Icon name="bed" />{room.bed}</span><span><Icon name="people" />{room.capacity} guests</span></div>
      <div className="amenities">{room.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div>
      <div className="room-bottom"><div><strong className="price">{formatMoney(room.nightlyRate)}</strong><span className="muted"> / night</span>{nights > 0 && <small className="room-total">{formatMoney(room.nightlyRate * nights)} for {nights} {nights === 1 ? "night" : "nights"}</small>}</div>
      <Link className="button button-soft" href={`/rooms?${params}`}>View room <Icon name="arrow" /></Link></div>
    </div>
  </article>;
}

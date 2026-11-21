"use client";

import { useEffect, useState } from "react";
import Link from "@/components/navigation/app-link";
import { useAuth } from "@/hooks/use-auth";
import { fetchVerifiedRecommendations, type RoomRecommendation } from "@/services/backend-recommendations";
import { RoomCard } from "@/components/public/room-card";
import { Icon } from "@/components/ui/icon";

export function LiveRecommendedRooms() {
  const account = useAuth();
  const id = account?.id;
  const role = account?.role;
  const [items, setItems] = useState<RoomRecommendation[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id || role !== "guest") return;
    let active = true;
    void fetchVerifiedRecommendations().then(value => {
      if (!active) return;
      setItems(value);
      setError("");
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load personalized suggestions.");
    });
    return () => { active = false; };
  }, [id, role]);
  if (!id || role !== "guest") return null;
  return <section className="workspace-section">
    <div className="section-heading"><div><span className="eyebrow">Your next stay</span><h2>Recommended for you</h2>
      <p className="muted">Based on verified stays, aggregate room popularity and hotel features. Availability for your dates must be checked separately.</p>
    </div><Link className="text-link" href="/rooms">Explore all rooms <Icon name="arrow" /></Link></div>
    {error && <p role="alert" className="auth-error">{error}</p>}
    {items.length > 0 && <div className="room-grid">{items.map(item => <div key={item.room.id}>
      <RoomCard room={item.room} />
      <p className="muted">{item.reason}</p>
    </div>)}</div>}
  </section>;
}

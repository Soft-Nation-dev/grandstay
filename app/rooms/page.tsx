import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { RoomBrowser } from "@/components/public/room-browser";

export const metadata: Metadata = { title: "Rooms & suites" };

export default function RoomsPage() {
  return <SiteShell active="rooms"><div className="shell page-section"><Suspense fallback={<p className="muted" role="status">Loading rooms…</p>}><RoomBrowser /></Suspense></div></SiteShell>;
}

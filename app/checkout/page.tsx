import type { Metadata } from "next";
import { Suspense } from "react";
import { Checkout } from "@/components/booking/checkout";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = { title: "Checkout" };

export default function Page() {
  return <SiteShell active="rooms"><div className="shell page-section"><Suspense fallback={<p role="status">Loading reservation…</p>}><Checkout /></Suspense></div></SiteShell>;
}

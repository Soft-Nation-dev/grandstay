import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { PaymentReturn } from "@/components/booking/payment-return";

export const metadata: Metadata = { title: "Payment verification" };

export default function Page() {
  return <SiteShell active="rooms"><div className="shell page-section"><Suspense fallback={<p role="status">Verifying payment…</p>}><PaymentReturn /></Suspense></div></SiteShell>;
}

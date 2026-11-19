import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GuestConcierge } from "@/components/experience/concierge";

export const metadata: Metadata = { title: "Concierge" };

export default function Page() {
  return <RoleGuard role="guest"><DashboardShell><Suspense fallback={<p role="status">Loading…</p>}><GuestConcierge /></Suspense></DashboardShell></RoleGuard>;
}

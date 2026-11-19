import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GuestServices } from "@/components/experience/service-requests";

export const metadata: Metadata = { title: "Hotel services" };

export default function Page() {
  return <RoleGuard role="guest"><DashboardShell><Suspense fallback={<p role="status">Loading…</p>}><GuestServices /></Suspense></DashboardShell></RoleGuard>;
}

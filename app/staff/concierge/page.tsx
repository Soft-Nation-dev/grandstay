import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StaffConcierge } from "@/components/experience/concierge";

export const metadata: Metadata = { title: "Concierge inbox" };

export default function Page() {
  return <RoleGuard role="staff"><DashboardShell><Suspense fallback={<p role="status">Loading…</p>}><StaffConcierge /></Suspense></DashboardShell></RoleGuard>;
}

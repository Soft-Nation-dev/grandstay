import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StaffCheckIns } from "@/components/experience/check-in";

export const metadata: Metadata = { title: "Check-in queue" };

export default function Page() {
  return <RoleGuard role="staff"><DashboardShell><Suspense fallback={<p role="status">Loading…</p>}><StaffCheckIns /></Suspense></DashboardShell></RoleGuard>;
}

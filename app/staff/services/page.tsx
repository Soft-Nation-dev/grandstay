import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StaffServices } from "@/components/experience/service-requests";

export const metadata: Metadata = { title: "Service requests" };

export default function Page() {
  return <RoleGuard role="staff"><DashboardShell><Suspense fallback={<p role="status">Loading…</p>}><StaffServices /></Suspense></DashboardShell></RoleGuard>;
}

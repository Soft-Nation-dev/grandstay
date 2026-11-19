import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GuestCheckIn } from "@/components/experience/check-in";

export const metadata: Metadata = { title: "Digital check-in" };

export default function Page() {
  return <RoleGuard role="guest"><DashboardShell><Suspense fallback={<p role="status">Loading…</p>}><GuestCheckIn /></Suspense></DashboardShell></RoleGuard>;
}

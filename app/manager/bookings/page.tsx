import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BookingHistory } from "@/components/booking/booking-history";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return <RoleGuard role="manager"><DashboardShell><Suspense fallback={<p role="status">Loading bookings…</p>}><BookingHistory /></Suspense></DashboardShell></RoleGuard>;
}

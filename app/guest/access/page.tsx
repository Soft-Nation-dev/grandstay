import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoomAccess } from "@/components/experience/room-access";

export const metadata: Metadata = { title: "Room access" };

export default function Page() {
  return <RoleGuard role="guest"><DashboardShell><Suspense fallback={<p role="status">Loading…</p>}><RoomAccess /></Suspense></DashboardShell></RoleGuard>;
}

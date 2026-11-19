import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoomManagement } from "@/components/management/room-management";

export const metadata: Metadata = { title: "Room management" };

export default function Page() {
  return <RoleGuard role="manager"><DashboardShell><RoomManagement /></DashboardShell></RoleGuard>;
}

import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StaffOverview } from "@/components/dashboard/staff-overview";

export const metadata: Metadata = { title: "Staff overview" };

export default function Page() {
  return <RoleGuard role="staff"><DashboardShell><StaffOverview /></DashboardShell></RoleGuard>;
}

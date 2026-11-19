import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ManagerOverview } from "@/components/management/overview";

export const metadata: Metadata = { title: "Manager overview" };

export default function Page() {
  return <RoleGuard role="manager"><DashboardShell><ManagerOverview /></DashboardShell></RoleGuard>;
}

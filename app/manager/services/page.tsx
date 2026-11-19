import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ServiceManagement } from "@/components/management/service-management";

export const metadata: Metadata = { title: "Services & performance" };

export default function Page() {
  return <RoleGuard role="manager"><DashboardShell><ServiceManagement /></DashboardShell></RoleGuard>;
}

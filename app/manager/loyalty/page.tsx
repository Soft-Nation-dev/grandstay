import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Loyalty } from "@/components/management/loyalty";

export const metadata: Metadata = { title: "Loyalty management" };

export default function Page() {
  return <RoleGuard role="manager"><DashboardShell><Loyalty manager /></DashboardShell></RoleGuard>;
}

import type { Metadata } from "next";
import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Loyalty } from "@/components/management/loyalty";

export const metadata: Metadata = { title: "My loyalty points" };

export default function Page() {
  return <RoleGuard role="guest"><DashboardShell><Loyalty /></DashboardShell></RoleGuard>;
}

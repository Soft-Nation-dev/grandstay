import type { Metadata } from "next";
import { RoleHome } from "@/components/dashboard/role-home";

export const metadata: Metadata = { title: "Staff workspace" };

export default function Page() {
  return <RoleHome role="staff" />;
}

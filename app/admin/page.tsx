import type { Metadata } from "next";
import { RoleHome } from "@/components/dashboard/role-home";

export const metadata: Metadata = { title: "Super admin" };

export default function Page() {
  return <RoleHome role="admin" />;
}

import type { Metadata } from "next";
import { RoleHome } from "@/components/dashboard/role-home";

export const metadata: Metadata = { title: "Manager workspace" };

export default function Page() {
  return <RoleHome role="manager" />;
}

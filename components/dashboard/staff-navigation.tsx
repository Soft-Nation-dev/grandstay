"use client";

import { WorkspaceNavigation } from "@/components/dashboard/workspace-navigation";
import type { IconName } from "@/components/ui/icon";

const links: { href: string; title: string; icon: IconName }[] = [
  { href: "/staff", title: "Overview", icon: "home" },
  { href: "/staff/bookings", title: "Reservations", icon: "calendar" },
  { href: "/staff/check-ins", title: "Check-ins", icon: "key" },
  { href: "/staff/services", title: "Services", icon: "list" },
  { href: "/staff/concierge", title: "Concierge", icon: "chat" },
];

export function StaffNavigation() {
  return <WorkspaceNavigation label="Staff navigation" links={links} />;
}

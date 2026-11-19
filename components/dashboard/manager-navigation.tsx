"use client";

import { WorkspaceNavigation } from "@/components/dashboard/workspace-navigation";
import type { IconName } from "@/components/ui/icon";

const links: { href: string; title: string; icon: IconName }[] = [
  { href: "/manager", title: "Overview", icon: "home" },
  { href: "/manager/bookings", title: "Bookings & payments", icon: "calendar" },
  { href: "/manager/rooms", title: "Rooms", icon: "bed" },
  { href: "/manager/services", title: "Services", icon: "list" },
  { href: "/manager/loyalty", title: "Loyalty", icon: "people" },
];

export function ManagerNavigation() {
  return <WorkspaceNavigation label="Manager navigation" links={links} />;
}

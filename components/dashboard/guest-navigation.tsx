"use client";

import { WorkspaceNavigation } from "@/components/dashboard/workspace-navigation";
import type { IconName } from "@/components/ui/icon";

const links: { href: string; title: string; icon: IconName }[] = [
  { href: "/guest", title: "Overview", icon: "home" },
  { href: "/guest/bookings", title: "Bookings", icon: "calendar" },
  { href: "/guest/check-in", title: "Check-in", icon: "key" },
  { href: "/guest/access", title: "Room access", icon: "shield" },
  { href: "/guest/services", title: "Services", icon: "list" },
  { href: "/guest/concierge", title: "Concierge", icon: "chat" },
  { href: "/guest/loyalty", title: "Loyalty", icon: "people" },
];

export function GuestNavigation() {
  return <WorkspaceNavigation label="Guest navigation" links={links} />;
}

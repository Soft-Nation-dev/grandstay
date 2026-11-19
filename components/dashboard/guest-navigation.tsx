"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

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
  const pathname = usePathname().replace(/\/$/, "") || "/";
  return <nav className="staff-navigation" aria-label="Guest navigation">{links.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} /><span>{item.title}</span></Link>)}</nav>;
}

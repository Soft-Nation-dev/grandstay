"use client";

import Link from "@/components/navigation/app-link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

const links: { href: string; title: string; icon: IconName }[] = [
  { href: "/manager", title: "Overview", icon: "home" },
  { href: "/manager/bookings", title: "Bookings & payments", icon: "calendar" },
  { href: "/manager/rooms", title: "Rooms", icon: "bed" },
  { href: "/manager/services", title: "Services", icon: "list" },
  { href: "/manager/loyalty", title: "Loyalty", icon: "people" },
];

export function ManagerNavigation() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  return <nav className="staff-navigation" aria-label="Manager navigation">{links.map(item => <Link resetScroll href={item.href} key={item.href} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} /><span>{item.title}</span></Link>)}</nav>;
}

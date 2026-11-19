"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";

const links: { href: string; title: string; icon: IconName }[] = [
  { href: "/staff", title: "Overview", icon: "home" },
  { href: "/staff/bookings", title: "Reservations", icon: "calendar" },
  { href: "/staff/check-ins", title: "Check-ins", icon: "key" },
  { href: "/staff/services", title: "Services", icon: "list" },
  { href: "/staff/concierge", title: "Concierge", icon: "chat" },
];

export function StaffNavigation() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  return <nav className="staff-navigation" aria-label="Staff navigation">{links.map(item => <Link href={item.href} key={item.href} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} /><span>{item.title}</span></Link>)}</nav>;
}

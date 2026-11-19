"use client";

import Link from "@/components/navigation/app-link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

type NavigationItem = { href: string; title: string; icon: IconName };

export function WorkspaceNavigation({ label, links }: { label: string; links: NavigationItem[] }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const navigation = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navigation.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const bounds = nav.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    if (tab.left < bounds.left + 5 || tab.right > bounds.right - 5) {
      nav.scrollLeft += tab.left - bounds.left - (nav.clientWidth - tab.width) / 2;
    }
  }, [pathname]);

  return <nav ref={navigation} className="staff-navigation" aria-label={label}>{links.map(item => <Link resetScroll key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} /><span>{item.title}</span></Link>)}</nav>;
}

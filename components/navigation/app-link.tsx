"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

export default function AppLink({ href, resetScroll = false, scroll, onNavigate, ...props }: ComponentProps<typeof Link> & { resetScroll?: boolean }) {
  const hash = typeof href === "string" && href.includes("#");
  return <Link {...props} href={href} scroll={scroll ?? hash} onNavigate={event => {
    onNavigate?.(event);
    if (typeof href !== "string") return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const normalize = (path: string) => path.replace(/\/$/, "") || "/";
    const target = new URL(href, window.location.origin);
    if (normalize(window.location.pathname) !== normalize(base + target.pathname)) return;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (hash && target.hash) {
      const anchor = document.getElementById(target.hash.slice(1));
      if (anchor) { event.preventDefault(); window.history.pushState(null, "", base + target.pathname + target.search + target.hash); anchor.scrollIntoView({ behavior, block: "start" }); }
      return;
    }
    if (resetScroll) window.scrollTo({ top: 0, left: 0, behavior });
  }} />;
}

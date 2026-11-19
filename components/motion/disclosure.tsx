"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Disclosure({ open, children }: { open: boolean; children: ReactNode }) {
  const [present, setPresent] = useState(open);
  const [previous, setPrevious] = useState(open);
  if (previous !== open) {
    setPrevious(open);
    if (open) setPresent(true);
  }

  useEffect(() => {
    if (open || !present) return;
    const timer = window.setTimeout(() => setPresent(false), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 360);
    return () => window.clearTimeout(timer);
  }, [open, present]);

  if (!present && !open) return null;
  return <div className={`motion-disclosure ${open ? "motion-disclosure-open" : "motion-disclosure-close"}`} inert={!open} aria-hidden={open ? undefined : true} onAnimationEnd={event => { if (event.target === event.currentTarget && !open) setPresent(false); }}><div className="motion-disclosure-inner">{children}</div></div>;
}

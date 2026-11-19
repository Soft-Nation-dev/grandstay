"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

export function RouteScroll() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const params = useSearchParams();
  const query = params.toString();
  const room = pathname === "/rooms" ? params.get("room") : null;
  const key = JSON.stringify([pathname, room]);
  const previous = useRef<string | null>(null);
  const historyTarget = useRef("");

  useEffect(() => {
    const onPop = () => { historyTarget.current = window.location.pathname + window.location.search; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useLayoutEffect(() => {
    const changed = previous.current !== null && previous.current !== key;
    previous.current = key;
    const restored = historyTarget.current === window.location.pathname + window.location.search;
    historyTarget.current = "";
    if (changed && !restored && !window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [key, query]);

  return null;
}

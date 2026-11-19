"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const selector = [
  ".hero", ".reserve-panel", ".tip-banner", ".section-heading", ".experience-card",
  ".room-card", ".facility-card", ".closing-banner", ".page-heading", ".search-panel",
  ".results-toolbar", ".results-heading", ".detail-photo", ".detail-info", ".detail-booking",
  ".checkout-panel", ".checkout-summary", ".auth-content", ".auth-visual-copy", ".guard-card",
  ".dashboard-welcome", ".dashboard-explanation", ".guest-stay", ".workspace-card",
  ".workspace-section > h3", ".workspace-section > div", ".experience-heading",
  ".staff-snapshot-heading", ".staff-metric", ".staff-section", ".staff-facilities > h2",
  ".management-panel:not(.dataset-section)", ".dataset-section > div:first-child",
  ".dataset-record", ".team-panel", ".experience-form", ".access-card", ".booking-card",
  ".confirmation-panel", ".empty-state", ".conversation-list", ".concierge-panel",
  ".staff-filter-panel", ".workspace-section > .booking-total",
].join(",");

export function MotionReveal() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const params = useSearchParams();
  const key = JSON.stringify([pathname, pathname === "/rooms" ? params.get("room") : null]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tracked = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    let frame = 0;

    function clear() {
      observer?.disconnect();
      mutations?.disconnect();
      observer = undefined;
      mutations = undefined;
      cancelAnimationFrame(frame);
      frame = 0;
      tracked.forEach(node => node.removeAttribute("data-gs-reveal"));
      tracked.clear();
    }

    function scan() {
      frame = 0;
      if (!observer) return;
      tracked.forEach(node => {
        if (!node.isConnected) {
          observer?.unobserve(node);
          node.removeAttribute("data-gs-reveal");
          tracked.delete(node);
        }
      });
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(node => {
        if (tracked.has(node) || !node.getClientRects().length || !node.closest("main, .guard-page")) return false;
        if (node.matches(".workspace-section > div") && !node.matches(".panel, .experience-heading, .staff-snapshot-heading, .section-heading") && !Array.from(node.children).some(child => child.tagName === "H2")) return false;
        return true;
      });
      const selected = new Set(candidates);
      for (const node of candidates) {
        let parent = node.parentElement;
        let nested = false;
        while (parent) {
          if (selected.has(parent) || tracked.has(parent)) { nested = true; break; }
          parent = parent.parentElement;
        }
        if (nested && !node.matches(".dataset-record")) continue;
        tracked.add(node);
        node.setAttribute("data-gs-reveal", "waiting");
        observer.observe(node);
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(scan);
    }

    function start() {
      clear();
      if (preference.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = entry.target as HTMLElement;
          node.setAttribute("data-gs-reveal", "shown");
          observer?.unobserve(node);
        }
      }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
      mutations = new MutationObserver(schedule);
      mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
      scan();
    }

    preference.addEventListener("change", start);
    start();
    return () => {
      preference.removeEventListener("change", start);
      clear();
    };
  }, [key]);

  return null;
}

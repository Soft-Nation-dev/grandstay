"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const selector = ".home-content .content-section>.section-heading,.home-content .experience-card,.home-content .room-card,.home-content .facility-card,.home-content>.closing-banner,.room-grid>.room-card,.workspace-grid>article,.workspace-card,.staff-operations-grid>section,.staff-metric,.staff-approval,.dataset-record,.booking-card,.access-card,.request-timeline li,.message,.experience-form,.management-panel,.guest-stay,.staff-facilities,.tip-banner,.reserve-panel,.checkout-summary,.confirmation-panel";
const easing = "cubic-bezier(.2,.75,.22,1)";

export function MotionDirector() {
  const pathname = usePathname();
  const params = useSearchParams();
  const room = pathname.replace(/\/$/, "") === "/rooms" ? params.get("room") : null;
  const route = JSON.stringify([pathname, room]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const seen = new WeakSet<Element>();
    let observer: IntersectionObserver | undefined;
    let mutations: MutationObserver | undefined;
    let frame = 0;
    let initial = 0;
    let main: HTMLElement | undefined;

    function play(element: Element, frames: Keyframe[], duration: number, delay = 0) {
      if (media.matches || !element.getClientRects().length) return;
      const animation = element.animate(frames, { duration, delay, easing, fill: "backwards" });
      animations.add(animation);
      animation.finished.catch(() => undefined).finally(() => animations.delete(animation));
    }

    function reveal(element: Element, index = 0) {
      if (seen.has(element)) return;
      seen.add(element);
      observer?.unobserve(element);
      play(element, [{ opacity: .18, translate: "0 18px" }, { opacity: 1, translate: "0 0" }], 530, Math.min(index * 45, 135));
    }

    function register(root: ParentNode, first = false) {
      const elements = [...(root instanceof Element && root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];
      for (const element of elements) {
        if (seen.has(element)) continue;
        const bounds = element.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) continue;
        if (first && bounds.top < innerHeight && bounds.bottom > 0) seen.add(element);
        else observer?.observe(element);
      }
    }

    function progress() {
      const line = document.querySelector<HTMLElement>(".motion-progress");
      const extent = document.documentElement.scrollHeight - innerHeight;
      if (line) line.style.transform = `scaleX(${extent > 0 ? Math.min(1, Math.max(0, window.scrollY / extent)) : 0})`;
    }

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; progress(); });
    }

    function stop() {
      cancelAnimationFrame(initial);
      cancelAnimationFrame(frame);
      frame = 0;
      observer?.disconnect();
      mutations?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }

    function start() {
      stop();
      if (media.matches) return;
      initial = requestAnimationFrame(() => {
        main = [...document.querySelectorAll<HTMLElement>("main,.auth-main")].find(element => element.getClientRects().length > 0);
        if (main) play(main, [{ opacity: .35, translate: "0 12px" }, { opacity: 1, translate: "0 0" }], 430);
        observer = new IntersectionObserver(entries => {
          entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).forEach((entry, index) => reveal(entry.target, index));
        }, { threshold: .06 });
        register(document, true);
        mutations = new MutationObserver(records => {
          for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) register(node);
          onScroll();
        });
        mutations.observe(document.body, { childList: true, subtree: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        progress();
      });
    }

    start();
    media.addEventListener("change", start);
    return () => { stop(); media.removeEventListener("change", start); };
  }, [route]);

  return <div className="motion-progress" aria-hidden="true" />;
}

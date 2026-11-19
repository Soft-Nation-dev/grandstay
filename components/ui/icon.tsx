import type { SVGProps } from "react";

const paths = {
  hotel: "M3 21h18M5 21V8h14v13M9 8V3h6v5M9 12h1m4 0h1m-6 4h1m4 0h1m-4 5v-2",
  bed: "M3 18V6m18 12V9M3 14h18M7 10h4v4H7zM11 10h7a3 3 0 0 1 3 3v1M3 18h18",
  key: "M15 3a6 6 0 0 0-5.7 7.9L3 17v4h4v-3h3v-3l2.1-2.3A6 6 0 1 0 15 3Zm2 5h.01",
  chat: "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z",
  list: "M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "m12 19-7-7 7-7m-7 7h14",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  people: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.9M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-8a4 4 0 0 1 0 8",
  check: "m5 12 4 4L19 6",
  location: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-8 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  search: "m21 21-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  home: "m3 10 9-7 9 7v11h-6v-7H9v7H3Z",
  info: "M12 11v5m0-8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}

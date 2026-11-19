import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { RouteScroll } from "@/components/navigation/route-scroll";
import "./globals.css";
import "./premium.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "GrandStay | Your comfort, our priority", template: "%s | GrandStay" },
  description: "Explore GrandStay rooms and enjoy a more seamless hotel guest experience.",
  applicationName: "GrandStay",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={jakarta.variable}><body><Suspense fallback={null}><RouteScroll /></Suspense>{children}</body></html>;
}

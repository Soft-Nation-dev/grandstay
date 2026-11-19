import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "GrandStay | Your comfort, our priority", template: "%s | GrandStay" },
  description: "Explore GrandStay rooms and enjoy a more seamless hotel guest experience.",
  applicationName: "GrandStay",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={jakarta.variable}><body>{children}</body></html>;
}

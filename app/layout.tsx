import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { MotionDirector } from "@/components/motion/motion-director";
import { RouteScroll } from "@/components/navigation/route-scroll";
import { ImageViewerProvider } from "@/components/ui/image-viewer";
import "./globals.css";
import "./premium.css";
import "./image-viewer.css";
import "./motion.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Guestly | Your comfort, our priority", template: "%s | Guestly" },
  description: "Explore Guestly rooms and enjoy a more seamless hotel guest experience.",
  applicationName: "Guestly",
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/guestly-mark.svg` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={jakarta.variable}><body><Suspense fallback={null}><RouteScroll /><MotionDirector /></Suspense><ImageViewerProvider>{children}</ImageViewerProvider></body></html>;
}

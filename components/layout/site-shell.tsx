import Link from "next/link";
import { AccountLink } from "@/components/auth/account-link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { hotel } from "@/data/mock";

export function Brand() {
  return <Link className="brand" href="/" aria-label="GrandStay home">
    <span className="brand-mark"><Icon name="hotel" width={27} height={27} /></span>
    <span className="brand-text"><strong>{hotel.name}</strong><small>HOSPITALITY</small></span>
  </Link>;
}

export function SiteShell({ children, active = "home" }: { children: ReactNode; active?: "home" | "rooms" }) {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="shell header-inner">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link href="/" aria-current={active === "home" ? "page" : undefined}>Home</Link>
        <Link href="/rooms" aria-current={active === "rooms" ? "page" : undefined}>Rooms &amp; suites</Link>
        <Link href="/#experience">Guest experience</Link>
      </nav>
      <div className="header-actions"><AccountLink /><Link className="button button-primary header-cta" href="/rooms">Find a room <Icon name="arrow" /></Link></div>
    </div></header>
    <main id="main-content" className="site-main">{children}</main>
    <footer className="site-footer"><div className="shell footer-inner">
      <Brand /><p>Thoughtful hospitality. Seamless stays.</p>
      <span>GrandStay · Frontend preview</span>
    </div></footer>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link href="/" aria-current={active === "home" ? "page" : undefined}><Icon name="home" />Home</Link>
      <Link href="/rooms" aria-current={active === "rooms" ? "page" : undefined}><Icon name="bed" />Rooms</Link>
      <Link href="/#experience"><Icon name="chat" />Experience</Link>
      <AccountLink mobile />
    </nav>
  </>;
}

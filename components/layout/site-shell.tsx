import Link from "@/components/navigation/app-link";
import { AccountLink } from "@/components/auth/account-link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { hotel } from "@/data/mock";

export function Brand() {
  return <Link className="brand" resetScroll href="/" aria-label="Guestly home">
    <span className="brand-mark"><svg width="29" height="29" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M24 8.5A10.5 10.5 0 1 0 25.5 21v-5H16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 24v-4.5h6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
    <span className="brand-text"><strong>{hotel.name}</strong><small>HOSPITALITY</small></span>
  </Link>;
}

export function SiteShell({ children, active = "home" }: { children: ReactNode; active?: "home" | "rooms" }) {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="shell header-inner">
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link resetScroll href="/" aria-current={active === "home" ? "page" : undefined}>Home</Link>
        <Link resetScroll href="/rooms" aria-current={active === "rooms" ? "page" : undefined}>Rooms &amp; suites</Link>
        <Link href="/#experience">Guest experience</Link>
      </nav>
      <div className="header-actions"><AccountLink /><Link className="button button-primary header-cta" resetScroll href="/rooms">Find a room <Icon name="arrow" /></Link></div>
    </div></header>
    <main id="main-content" className="site-main">{children}</main>
    <footer className="site-footer"><div className="shell footer-inner">
      <Brand /><p>Thoughtful hospitality. Seamless stays.</p>
      <span>Guestly Hospitality</span>
    </div></footer>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link resetScroll href="/" aria-current={active === "home" ? "page" : undefined}><Icon name="home" />Home</Link>
      <Link resetScroll href="/rooms" aria-current={active === "rooms" ? "page" : undefined}><Icon name="bed" />Rooms</Link>
      <Link href="/#experience"><Icon name="chat" />Experience</Link>
      <AccountLink mobile />
    </nav>
  </>;
}

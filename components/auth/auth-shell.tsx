import Image from "@/components/ui/hotel-image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/layout/site-shell";
import { Icon } from "@/components/ui/icon";

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="auth-shell">
    <section className="auth-main">
      <div className="auth-top"><Brand /><Link className="text-link" href="/"><Icon name="back" /> Back to home</Link></div>
      <div className="auth-content">
        <span className="eyebrow">Your GrandStay account</span>
        <h1>{title}</h1><p className="auth-intro">{description}</p>
        {children}
      </div>
      <p className="auth-footer">GrandStay Hospitality</p>
    </section>
    <aside className="auth-visual" aria-hidden="true">
      <Image src="/images/deluxe-executive-suite.jpg" alt="" fill sizes="50vw" priority />
      <div className="auth-visual-copy"><span>THE GRANDSTAY EXPERIENCE</span><h2>Every stay, made simple.</h2><p>Thoughtful hospitality, from booking to the moment you leave.</p></div>
    </aside>
  </main>;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { GuestNavigation } from "@/components/dashboard/guest-navigation";
import { ManagerNavigation } from "@/components/dashboard/manager-navigation";
import { StaffNavigation } from "@/components/dashboard/staff-navigation";
import { Brand } from "@/components/layout/site-shell";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth";
import { roleLabels, roleRoutes } from "@/types/auth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const account = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  if (!account) return null;
  function logout() {
    signOut();
    router.replace("/login");
  }
  return <>
    <a className="skip-link" href="#dashboard-content">Skip to content</a>
    <header className="site-header"><div className="shell header-inner">
      <Brand /><div className="dashboard-header-actions"><span className="role-pill">{roleLabels[account.role]}</span><button className="button button-soft logout-button" onClick={logout}><Icon name="logout" /> Sign out</button></div>
    </div></header>
    <main className="shell dashboard-page" id="dashboard-content">
      <Link href="/" className="text-link"><Icon name="back" /> Hotel homepage</Link>
      <div className="dashboard-welcome"><div><span className="eyebrow">{roleLabels[account.role]} workspace</span><h1>Welcome, {account.name.split(" ")[0]}.</h1><p>{account.email}</p></div><div className="dashboard-avatar" aria-hidden="true">{account.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</div></div>
      {account.role === "guest" && <GuestNavigation />}
      {account.role === "staff" && <StaffNavigation />}
      {account.role === "manager" && <ManagerNavigation />}
      {pathname === roleRoutes[account.role] && <aside className="panel dashboard-explanation"><span className="feature-icon"><Icon name="info" /></span><div><h2>Frontend demonstration</h2><p>Use fictional details only. Accounts, hotel records and messages are stored in this browser. Payments, identity checks and access codes are simulations; no money is charged, no actual ID is uploaded and no physical door is unlocked. Live authentication, shared data and integrations will be enabled by the backend.</p></div></aside>}
      {children}
    </main>
  </>;
}

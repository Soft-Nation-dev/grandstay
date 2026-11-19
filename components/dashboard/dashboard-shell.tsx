"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { StaffNavigation } from "@/components/dashboard/staff-navigation";
import { Brand } from "@/components/layout/site-shell";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/auth";
import { roleLabels } from "@/types/auth";

export function DashboardShell({ children }: { children: ReactNode }) {
  const account = useAuth();
  const router = useRouter();
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
      {account.role === "staff" && <StaffNavigation />}
      {children}
      <p className="auth-disclaimer"><Icon name="info" />Demo workspace. Account data is stored locally in this browser and is not protected by a backend.</p>
    </main>
  </>;
}

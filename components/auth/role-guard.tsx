"use client";

import Link from "@/components/navigation/app-link";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Icon } from "@/components/ui/icon";
import { roleLabels, roleRoutes, type Role } from "@/types/auth";

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const account = useAuth();
  if (account === undefined) return <div className="guard-page"><p role="status">Loading your account…</p></div>;
  if (!account || account.role !== role) return <main className="guard-page"><div className="panel guard-card">
    <span className="feature-icon"><Icon name="shield" width={25} height={25} /></span>
    <h1>{account ? "Access restricted" : "Sign in to continue"}</h1>
    <p>{account ? `This area is reserved for ${roleLabels[role].toLowerCase()} accounts.` : "You need an account to continue to this area."}</p>
    <Link className="button button-primary" href={account ? roleRoutes[account.role] : "/login"}>{account ? "Back to your dashboard" : "Sign in"} <Icon name="arrow" /></Link>
    <Link className="text-link" href="/">Return home</Link>
  </div></main>;
  return children;
}

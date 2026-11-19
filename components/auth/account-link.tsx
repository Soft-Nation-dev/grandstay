"use client";

import Link from "@/components/navigation/app-link";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/hooks/use-auth";
import { roleRoutes } from "@/types/auth";

export function AccountLink({ mobile = false }: { mobile?: boolean }) {
  const account = useAuth();
  return <Link className={mobile ? undefined : "account-link"} href={account ? roleRoutes[account.role] : "/login"}><Icon name="user" />{account ? "My account" : "Sign in"}</Link>;
}

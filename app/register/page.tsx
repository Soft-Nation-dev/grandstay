import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <AuthShell title="Make yourself at home" description="Create a guest account to book and manage your stay."><Suspense fallback={<p role="status">Loading registration…</p>}><AuthForm register /></Suspense></AuthShell>;
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <AuthShell title="Welcome back" description="Sign in to continue your GrandStay experience."><Suspense fallback={<p role="status">Loading sign in…</p>}><AuthForm /></Suspense></AuthShell>;
}

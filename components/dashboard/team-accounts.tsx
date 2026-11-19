"use client";

import { useState, type FormEvent } from "react";
import { useAccounts } from "@/hooks/use-auth";
import { provisionTeamAccount } from "@/services/auth";
import { roleLabels } from "@/types/auth";
import { PasswordField } from "@/components/auth/password-field";
import { Icon } from "@/components/ui/icon";

export function TeamAccounts() {
  const accounts = useAccounts().filter(account => account.role === "staff" || account.role === "manager");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const role = values.get("role") === "manager" ? "manager" : "staff";
      const account = await provisionTeamAccount({ name: String(values.get("name") ?? ""), email: String(values.get("email") ?? ""), password: String(values.get("password") ?? ""), role });
      form.reset();
      setSuccess(`${roleLabels[account.role]} account created for ${account.name}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="team-grid">
    <section className="panel team-panel">
      <div><span className="eyebrow">Account provisioning</span><h2>Create team account</h2><p className="muted">Only super admins can add staff and managers.</p></div>
      <form className="auth-form-stack" onSubmit={submit} aria-busy={busy}>
        <label className="auth-field"><span>Full name</span><input name="name" minLength={2} required /></label>
        <label className="auth-field"><span>Demo email address</span><input name="email" type="email" required /></label>
        <label className="auth-field"><span>Role</span><select name="role"><option value="staff">Staff</option><option value="manager">Manager</option></select></label>
        <PasswordField label="Demo password" autoComplete="new-password" minLength={8} />
        <p className="field-hint">Use fictional details only. No invitations or emails are sent.</p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {success && <p className="auth-notice" role="status"><Icon name="check" />{success}</p>}
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
    </section>
    <section className="panel team-panel">
      <div><span className="eyebrow">Team directory</span><h2>Staff &amp; managers</h2><p className="muted">{accounts.length} team {accounts.length === 1 ? "account" : "accounts"}</p></div>
      <div className="team-list">{accounts.map(account => <div className="team-row" key={account.id}><span className="team-avatar"><Icon name="user" /></span><div><strong>{account.name}</strong><p>{account.email}</p></div><span className="role-pill">{roleLabels[account.role]}</span></div>)}</div>
    </section>
  </div>;
}

'use client';

import { useState, type FormEvent } from 'react';
import { backendUpdateProfile } from '@/services/backend-auth';
import { useAuth } from '@/hooks/use-auth';

export function ProfileEditor() {
  const account = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  if (!account) return null;
  const parts = account.name.trim().split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await backendUpdateProfile({
        firstName: String(values.get('firstName') || ''),
        lastName: String(values.get('lastName') || ''),
        phone: String(values.get('phone') || ''),
      });
      setNotice('Your profile has been updated.');
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update your profile.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="profile-editor">
    <button type="button" className="text-link" onClick={() => { setOpen(!open); setError(''); }}>{open ? 'Close profile' : 'Edit profile'}</button>
    {notice && <p className="auth-notice" role="status">{notice}</p>}
    {open && <form className="panel auth-form-stack" onSubmit={save} aria-busy={busy}>
      <label className="auth-field"><span>First name</span><input name="firstName" defaultValue={firstName} minLength={2} maxLength={100} required /></label>
      <label className="auth-field"><span>Last name</span><input name="lastName" defaultValue={lastName} minLength={2} maxLength={100} required /></label>
      <label className="auth-field"><span>Phone (optional)</span><input name="phone" type="tel" defaultValue={account.phone || ''} maxLength={32} /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>}
  </div>;
}

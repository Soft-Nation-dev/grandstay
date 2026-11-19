"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

export function PasswordField({ label = "Password", name = "password", autoComplete = "current-password", minLength }: { label?: string; name?: string; autoComplete?: string; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return <label className="auth-field">
    <span>{label}</span>
    <span className="password-input">
      <input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} required />
      <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name={visible ? "eyeOff" : "eye"} /></button>
    </span>
  </label>;
}

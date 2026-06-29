"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { localizedPath, type Locale } from "@/lib/i18n";

export function ResetPasswordForm({
  email,
  locale,
  token
}: {
  email: string;
  locale: Locale;
  token: string;
}) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          token
        })
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Unable to reset password.");
        return;
      }

      setDone(true);
      setPassword("");
      setMessage("Password updated. You can sign in with your new password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="resetPasswordForm" onSubmit={submit}>
      <span className="resetPasswordIcon" aria-hidden="true">
        <LockKeyhole size={24} />
      </span>
      <h1>Reset your password</h1>
      <p>{email ? `Choose a new password for ${email}.` : "Open the reset link from your email to continue."}</p>
      <label className="modalField">
        <span>New password</span>
        <input
          type="password"
          minLength={8}
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={done || !email || !token}
        />
      </label>
      {message ? <p className={done ? "formMessage" : "formError"}>{message}</p> : null}
      <button className="btn btnPrimary" type="submit" disabled={busy || done || !email || !token}>
        {busy ? "Updating..." : done ? "Updated" : "Update password"}
      </button>
      <a className="resetBackLink" href={localizedPath(locale)}>
        Back to DeVoice
      </a>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { saveGmailPasswordConfig } from "@/lib/actions/settings";
import { Button } from "@/components/ui";
import type { EmailConfigPublic } from "@/lib/actions/settings";

type GmailPasswordFormProps = {
  config: EmailConfigPublic | null;
  encryptionConfigured: boolean;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function GmailPasswordForm({
  config,
  encryptionConfigured,
}: GmailPasswordFormProps) {
  const [fromName, setFromName] = useState(
    config?.provider === "GMAIL_PASSWORD" ? config.fromName : "Voting App",
  );
  const [fromEmail, setFromEmail] = useState(
    config?.provider === "GMAIL_PASSWORD" ? config.fromEmail : "",
  );
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveGmailPasswordConfig({
        fromName,
        fromEmail,
        appPassword,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Saved.");
      setAppPassword("");
    });
  }

  if (!encryptionConfigured) {
    return (
      <p className="text-sm text-amber-400">
        Set <code className="text-xs">EMAIL_ENCRYPTION_KEY</code> in your
        environment (64-character hex) before saving credentials.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-text-muted">
        Use a Gmail address and a 16-character app password from your Google
        account security settings.
      </p>

      <div className="space-y-1">
        <label htmlFor="gmail-from-name" className={labelClass}>
          Display name
        </label>
        <input
          id="gmail-from-name"
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="gmail-from-email" className={labelClass}>
          Gmail address
        </label>
        <input
          id="gmail-from-email"
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="you@gmail.com"
          className={inputClass}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="gmail-app-password" className={labelClass}>
          App password
        </label>
        <input
          id="gmail-app-password"
          type="password"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          placeholder={
            config?.provider === "GMAIL_PASSWORD"
              ? "Leave blank to keep current password"
              : "xxxx xxxx xxxx xxxx"
          }
          className={inputClass}
          autoComplete="new-password"
          required={config?.provider !== "GMAIL_PASSWORD"}
        />
        {config?.provider === "GMAIL_PASSWORD" ? (
          <p className="text-xs text-text-muted">
            Enter a new app password only when you want to replace the stored
            one.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-live" role="status">
          {success}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save app password connection"}
      </Button>
    </form>
  );
}

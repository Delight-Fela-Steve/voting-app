"use client";

import { useState, useTransition } from "react";
import {
  removeBackupAppPassword,
  saveBackupAppPassword,
  type EmailConfigPublic,
} from "@/lib/actions/settings";
import { Badge, Button, PasswordInput } from "@/components/ui";

type GmailBackupPasswordFormProps = {
  config: EmailConfigPublic;
  encryptionConfigured: boolean;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function GmailBackupPasswordForm({
  config,
  encryptionConfigured,
}: GmailBackupPasswordFormProps) {
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveBackupAppPassword({ appPassword });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Saved.");
      setAppPassword("");
    });
  }

  function handleRemove() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await removeBackupAppPassword();

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Removed.");
    });
  }

  if (!encryptionConfigured) {
    return (
      <p className="mt-4 text-sm text-amber-400">
        Set <code className="text-xs">EMAIL_ENCRYPTION_KEY</code> in your
        environment (64-character hex) before saving a backup app password.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border px-4 py-3">
      <h3 className="text-sm font-medium text-text-primary">
        Backup app password
      </h3>
      <p className="mt-1 text-xs text-text-muted">
        If Gmail OAuth ever fails (an expired or revoked token, for example),
        emails will automatically send using this app password instead.
      </p>

      {config.hasBackupAppPassword ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge variant="live">Backup configured</Badge>
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? "Removing…" : "Remove backup"}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-3 space-y-3">
          <div className="space-y-1">
            <label htmlFor="gmail-backup-app-password" className={labelClass}>
              App password
            </label>
            <PasswordInput
              id="gmail-backup-app-password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              className={inputClass}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save backup password"}
          </Button>
        </form>
      )}

      {error ? (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-2 text-xs text-live" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  disconnectEmailConfig,
  sendTestEmail,
  type EmailConfigPublic,
} from "@/lib/actions/settings";
import { GmailOAuthSection } from "@/components/admin/gmail-oauth-section";
import { GmailPasswordForm } from "@/components/admin/gmail-password-form";
import { Badge, Button, Card } from "@/components/ui";

type ConnectionMode = "oauth" | "password";

type EmailServiceSectionProps = {
  config: EmailConfigPublic | null;
  googleOAuthConfigured: boolean;
  encryptionConfigured: boolean;
  flashMessage?: string | null;
  flashError?: string | null;
};

function providerLabel(provider: EmailConfigPublic["provider"]): string {
  return provider === "GMAIL_OAUTH" ? "Gmail (OAuth)" : "Gmail (App password)";
}

export function EmailServiceSection({
  config,
  googleOAuthConfigured,
  encryptionConfigured,
  flashMessage,
  flashError,
}: EmailServiceSectionProps) {
  const defaultMode: ConnectionMode =
    config?.provider === "GMAIL_PASSWORD" ? "password" : "oauth";
  const [mode, setMode] = useState<ConnectionMode>(defaultMode);
  const [message, setMessage] = useState<string | null>(flashMessage ?? null);
  const [error, setError] = useState<string | null>(flashError ?? null);
  const [isPending, startTransition] = useTransition();

  const connected = Boolean(config?.connected);

  function handleDisconnect() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await disconnectEmailConfig();
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.success ?? "Disconnected.");
    });
  }

  function handleTestEmail() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await sendTestEmail();
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(result.success ?? "Test email sent.");
    });
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Email service
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Connect Gmail to send admin invitations and profile verification
            codes.
          </p>
        </div>
        {connected && config ? (
          <Badge variant="live">Connected</Badge>
        ) : (
          <Badge variant="default">Not connected</Badge>
        )}
      </div>

      {connected && config ? (
        <div className="mt-4 rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm">
          <p className="text-text-muted">
            Sending as{" "}
            <span className="font-medium text-text-primary">
              {config.fromName} &lt;{config.fromEmail}&gt;
            </span>
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Method: {providerLabel(config.provider)}
          </p>
        </div>
      ) : null}

      {(message || error) && (
        <div className="mt-4 space-y-2">
          {message ? (
            <p className="text-sm text-live" role="status">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}

      {connected ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleTestEmail}
            disabled={isPending}
          >
            {isPending ? "Sending…" : "Send test email"}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDisconnect}
            disabled={isPending}
          >
            Disconnect
          </Button>
        </div>
      ) : null}

      {connected ? (
        <p className="mt-6 text-xs text-text-muted">
          To switch connection method, disconnect first, then connect using OAuth
          or app password.
        </p>
      ) : (
        <div className="mt-6">
          <div
            className="inline-flex rounded-lg border border-border p-1"
            role="tablist"
            aria-label="Connection method"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "oauth"}
              onClick={() => setMode("oauth")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                mode === "oauth"
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Gmail OAuth
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "password"}
              onClick={() => setMode("password")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                mode === "password"
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              App password
            </button>
          </div>

          <div className="mt-4">
            {mode === "oauth" ? (
              <GmailOAuthSection
                config={config}
                googleOAuthConfigured={googleOAuthConfigured}
                encryptionConfigured={encryptionConfigured}
              />
            ) : (
              <GmailPasswordForm
                config={config}
                encryptionConfigured={encryptionConfigured}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

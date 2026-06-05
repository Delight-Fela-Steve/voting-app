"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { EmailConfigPublic } from "@/lib/actions/settings";

type GmailOAuthSectionProps = {
  config: EmailConfigPublic | null;
  googleOAuthConfigured: boolean;
  encryptionConfigured: boolean;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function GmailOAuthSection({
  config,
  googleOAuthConfigured,
  encryptionConfigured,
}: GmailOAuthSectionProps) {
  const [fromName, setFromName] = useState(
    config?.provider === "GMAIL_OAUTH" ? config.fromName : "Voting App",
  );

  const oauthConnected = config?.provider === "GMAIL_OAUTH" && config.connected;

  if (!googleOAuthConfigured) {
    return (
      <p className="text-sm text-amber-400">
        Set <code className="text-xs">GOOGLE_CLIENT_ID</code> and{" "}
        <code className="text-xs">GOOGLE_CLIENT_SECRET</code> in your environment
        to enable Gmail OAuth.
      </p>
    );
  }

  if (!encryptionConfigured) {
    return (
      <p className="text-sm text-amber-400">
        Set <code className="text-xs">EMAIL_ENCRYPTION_KEY</code> in your
        environment before connecting Gmail via OAuth.
      </p>
    );
  }

  if (oauthConnected) {
    return (
      <div className="space-y-2 text-sm text-text-muted">
        <p>
          Connected as{" "}
          <span className="font-medium text-text-primary">
            {config.fromName} &lt;{config.fromEmail}&gt;
          </span>
        </p>
        <p className="text-xs">
          Reconnect below to switch accounts or refresh tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Sign in with Google to send mail through your Gmail account. You will be
        redirected to Google and returned here when complete.
      </p>

      <div className="space-y-1">
        <label htmlFor="oauth-from-name" className={labelClass}>
          Display name
        </label>
        <input
          id="oauth-from-name"
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          className={inputClass}
        />
      </div>

      <Button
        type="button"
        onClick={() => {
          const params = new URLSearchParams({
            fromName: fromName.trim() || "Voting App",
          });
          window.location.href = `/api/settings/gmail-oauth?${params.toString()}`;
        }}
      >
        Connect Gmail
      </Button>
    </div>
  );
}

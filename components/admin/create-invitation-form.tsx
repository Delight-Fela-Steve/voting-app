"use client";

import { useActionState } from "react";
import {
  createInvitation,
  type InvitationActionState,
} from "@/lib/actions/invitations";
import { CopyInviteLinkButton } from "@/components/admin/copy-invite-link-button";
import { Button, Card } from "@/components/ui";

type CreateInvitationFormProps = {
  emailConfigured: boolean;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function CreateInvitationForm({
  emailConfigured,
}: CreateInvitationFormProps) {
  const [state, formAction, pending] = useActionState<
    InvitationActionState,
    FormData
  >(createInvitation, {});

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <form action={formAction} className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Create invitation
          </h2>
          <p className="text-sm text-text-muted">
            Generate a link for a new admin. Optionally lock the invite to a
            specific email address and send it by email.
          </p>

          <div className="space-y-1">
            <label htmlFor="email" className={labelClass}>
              Email lock (optional)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              className={inputClass}
            />
            <p className="text-xs text-text-muted">
              If set, only this email can complete registration.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="expiresInDays" className={labelClass}>
              Expires in (days)
            </label>
            <input
              id="expiresInDays"
              name="expiresInDays"
              type="number"
              min={1}
              max={90}
              defaultValue={7}
              className={inputClass}
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              name="sendEmail"
              className="mt-0.5 rounded border-border bg-surface accent-accent"
            />
            <span>
              Send invitation email
              {emailConfigured ? (
                <span className="block text-xs text-text-muted">
                  Requires an email address above. Uses Gmail from Settings.
                </span>
              ) : (
                <span className="block text-xs text-amber-400">
                  Email is not configured — connect Gmail in Settings to enable
                  sending.
                </span>
              )}
            </span>
          </label>

          {state.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create invitation"}
          </Button>
        </form>
      </Card>

      {state.inviteUrl ? (
        <Card className="border-live/30 bg-live/10 p-4">
          <p className="text-sm font-medium text-live">
            Invitation created — share this link:
          </p>
          <p className="mt-2 break-all text-sm text-text-primary">
            {state.inviteUrl}
          </p>
          {state.emailSent ? (
            <p className="mt-2 text-sm text-live">
              Invitation email sent successfully.
            </p>
          ) : null}
          {state.emailError ? (
            <p className="mt-2 text-sm text-amber-400" role="alert">
              Link created, but email failed: {state.emailError}
            </p>
          ) : null}
          {state.emailSkipped ? (
            <p className="mt-2 text-sm text-amber-400">
              Link created. Email was not sent — copy the link below instead.
            </p>
          ) : null}
          <div className="mt-3">
            <CopyInviteLinkButton url={state.inviteUrl} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

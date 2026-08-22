"use client";

import { useState, useTransition } from "react";
import { revokeInvitation } from "@/lib/actions/invitations";
import { CopyInviteLinkButton } from "@/components/admin/copy-invite-link-button";
import { Card } from "@/components/ui";
import type { InvitationStatus } from "@/lib/generated/prisma/client";

export type InvitationListItem = {
  id: string;
  email: string | null;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  inviteUrl: string;
  invitedBy: { name: string };
  usedBy: { name: string; email: string } | null;
};

function statusClasses(status: InvitationStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-live/15 text-live";
    case "ACCEPTED":
      return "bg-surface-raised text-text-muted";
    case "REVOKED":
      return "bg-red-500/15 text-red-400";
    case "EXPIRED":
      return "bg-surface-raised text-text-muted";
    default:
      return "bg-surface-raised text-text-muted";
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

type RevokeInvitationButtonProps = {
  invitationId: string;
};

function RevokeInvitationButton({ invitationId }: RevokeInvitationButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRevoke() {
    const confirmed = window.confirm(
      "Revoke this invitation? The link will stop working.",
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await revokeInvitation(invitationId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to revoke invitation.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRevoke}
        disabled={pending}
        className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-60"
      >
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InvitationListProps = {
  invitations: InvitationListItem[];
};

export function InvitationList({ invitations }: InvitationListProps) {
  if (invitations.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center text-sm text-text-muted">
        No invitations yet. Create one above to invite a new admin.
      </Card>
    );
  }

  return (
    <>
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-raised">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Email lock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Used by
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-surface-raised/60">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(invitation.status)}`}
                    >
                      {invitation.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {invitation.email ?? "Any email"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {formatDate(invitation.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {formatDate(invitation.expiresAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {invitation.usedBy
                      ? `${invitation.usedBy.name} (${invitation.usedBy.email})`
                      : invitation.usedAt
                        ? formatDate(invitation.usedAt)
                        : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {invitation.status === "PENDING" ? (
                        <>
                          <CopyInviteLinkButton url={invitation.inviteUrl} />
                          <RevokeInvitationButton invitationId={invitation.id} />
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-3 md:hidden">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(invitation.status)}`}
              >
                {invitation.status}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                Expires {formatDate(invitation.expiresAt)}
              </span>
            </div>
            <p className="mt-2 text-sm text-text-primary">
              {invitation.email ?? "Any email"}
            </p>
            <div className="mt-2 text-xs text-text-muted">
              <p>Created {formatDate(invitation.createdAt)}</p>
              <p>
                Used by{" "}
                {invitation.usedBy
                  ? `${invitation.usedBy.name} (${invitation.usedBy.email})`
                  : invitation.usedAt
                    ? formatDate(invitation.usedAt)
                    : "—"}
              </p>
            </div>
            {invitation.status === "PENDING" ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                <CopyInviteLinkButton url={invitation.inviteUrl} />
                <RevokeInvitationButton invitationId={invitation.id} />
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </>
  );
}

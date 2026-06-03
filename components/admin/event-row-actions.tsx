"use client";

import { CopyInviteLinkButton } from "@/components/admin/copy-invite-link-button";

type EventRowActionsProps = {
  voteUrl: string;
  resultsUrl: string;
};

export function EventRowActions({ voteUrl, resultsUrl }: EventRowActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <CopyInviteLinkButton url={voteUrl} label="Vote link" />
      <CopyInviteLinkButton url={resultsUrl} label="Results link" />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type CopyInviteLinkButtonProps = {
  url: string;
  label?: string;
};

export function CopyInviteLinkButton({
  url,
  label = "Copy link",
}: CopyInviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={handleCopy}>
      {copied ? "Copied!" : label}
    </Button>
  );
}

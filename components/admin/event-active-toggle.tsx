"use client";

import { useTransition } from "react";
import { toggleEventActive } from "@/lib/actions/events";

type EventActiveToggleProps = {
  eventId: string;
  isActive: boolean;
};

export function EventActiveToggle({ eventId, isActive }: EventActiveToggleProps) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleEventActive(eventId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={isActive ? "Deactivate voting" : "Activate voting"}
      className={
        isActive
          ? "inline-flex rounded-full bg-live/15 px-2.5 py-0.5 text-xs font-medium text-live transition hover:bg-live/25 disabled:opacity-60"
          : "inline-flex rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-muted transition hover:bg-surface-raised/80 disabled:opacity-60"
      }
    >
      {pending ? "…" : isActive ? "Active" : "Inactive"}
    </button>
  );
}

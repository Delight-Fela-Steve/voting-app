"use client";

import { useTransition } from "react";
import { deleteEvent } from "@/lib/actions/events";

type DeleteEventButtonProps = {
  eventId: string;
  eventName: string;
};

export function DeleteEventButton({ eventId, eventName }: DeleteEventButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Delete "${eventName}"? This removes all participants and votes.`,
    );
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      await deleteEvent(eventId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete event"}
    </button>
  );
}

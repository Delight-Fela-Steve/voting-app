"use client";

import { useTransition } from "react";
import { toggleResultsPublished } from "@/lib/actions/events";

type ResultsPublishedToggleProps = {
  eventId: string;
  resultsPublished: boolean;
};

export function ResultsPublishedToggle({
  eventId,
  resultsPublished,
}: ResultsPublishedToggleProps) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleResultsPublished(eventId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={
        resultsPublished
          ? "Unpublish results (hide from the public)"
          : "Publish results (make visible to the public)"
      }
      className={
        resultsPublished
          ? "inline-flex rounded-full bg-live/15 px-2.5 py-0.5 text-xs font-medium text-live transition hover:bg-live/25 disabled:opacity-60"
          : "inline-flex rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-muted transition hover:bg-surface-raised/80 disabled:opacity-60"
      }
    >
      {pending ? "…" : resultsPublished ? "Results published" : "Results unpublished"}
    </button>
  );
}

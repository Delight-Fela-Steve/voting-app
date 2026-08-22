"use client";

import { useTransition } from "react";
import { toggleResultsPublished } from "@/lib/actions/events";
import { Button, Card } from "@/components/ui";

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
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Results publishing
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {resultsPublished
              ? "Results are visible to the public."
              : "Results are hidden from the public until you publish them."}
          </p>
        </div>
        <Button
          type="button"
          variant={resultsPublished ? "success" : "ghost"}
          onClick={handleToggle}
          disabled={pending}
        >
          {pending
            ? "…"
            : resultsPublished
              ? "Published · click to unpublish"
              : "Publish results"}
        </Button>
      </div>
    </Card>
  );
}

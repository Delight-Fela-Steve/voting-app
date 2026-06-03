"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VoteBarChart } from "@/components/results/VoteBarChart";
import { Badge, Button, Card } from "@/components/ui";
import type { EventResults } from "@/lib/results";

type ResultsDashboardProps = {
  slug: string;
  initialResults: EventResults;
};

function formatUpdatedAt(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank > 3) return null;

  const colors = ["text-amber-400", "text-slate-300", "text-amber-700"];
  return (
    <svg
      className={`h-5 w-5 ${colors[rank - 1]}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function ResultsDashboard({
  slug,
  initialResults,
}: ResultsDashboardProps) {
  const [results, setResults] = useState(initialResults);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "live" | "error"
  >("connecting");

  useEffect(() => {
    const source = new EventSource(`/api/results/${slug}/stream`);

    source.onopen = () => {
      setConnectionState("live");
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as EventResults;
        setResults(payload);
        setConnectionState("live");
      } catch {
        setConnectionState("error");
      }
    };

    source.onerror = () => {
      setConnectionState("error");
    };

    return () => {
      source.close();
    };
  }, [slug]);

  const hasVotes = results.totalVotes > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-text-muted">
            Live results
          </p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">
            {results.eventName}
          </h1>
        </div>

        {connectionState === "live" ? (
          <Badge variant="live">Updating live</Badge>
        ) : (
          <Badge variant="default">
            {connectionState === "connecting" ? "Connecting…" : "Reconnecting…"}
          </Badge>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-6">
        <p className="text-4xl font-bold tabular-nums text-text-primary">
          {results.totalVotes}
        </p>
        <div className="text-sm text-text-muted">
          <p>
            total {results.totalVotes === 1 ? "vote" : "votes"}
          </p>
          <p className="mt-0.5">
            Last updated{" "}
            <span className="font-medium text-text-primary">
              {formatUpdatedAt(results.updatedAt)}
            </span>
          </p>
        </div>
      </div>

      <Card className="mt-8 p-6">
        {hasVotes ? (
          <VoteBarChart participants={results.participants} />
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-text-primary">No votes yet</p>
            <p className="mt-2 max-w-md text-text-muted">
              Rankings will appear here as soon as the first vote is cast. This
              page updates automatically.
            </p>
            <Link href={`/vote/${slug}`} className="mt-6">
              <Button>Cast a vote</Button>
            </Link>
          </div>
        )}
      </Card>

      {results.participants.length > 0 && (
        <ol className="mt-8 space-y-2">
          {results.participants.map((participant, index) => (
            <li
              key={participant.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition hover:bg-surface-raised"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    index < 3
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-raised text-text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <MedalIcon rank={index + 1} />
                <span className="font-medium text-text-primary">
                  {participant.name}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-text-muted">
                {participant.voteCount}{" "}
                {participant.voteCount === 1 ? "vote" : "votes"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

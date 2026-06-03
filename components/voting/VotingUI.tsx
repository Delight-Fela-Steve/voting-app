"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ParticipantAvatar } from "@/components/ParticipantAvatar";
import { Button, Card } from "@/components/ui";
import type { PublicParticipant } from "@/lib/events/public";
import { loadVisitorId } from "@/lib/voting/client-fingerprint";

type ViewState = "voting" | "submitting" | "success" | "already_voted" | "error";

type VotingUIProps = {
  slug: string;
  eventName: string;
  eventDescription: string | null;
  participants: PublicParticipant[];
};

export function VotingUI({
  slug,
  eventName,
  eventDescription,
  participants,
}: VotingUIProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>("voting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [fingerprintReady, setFingerprintReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadVisitorId().then((id) => {
      if (!cancelled) {
        setVisitorId(id || null);
        setFingerprintReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const submitVote = useCallback(async () => {
    if (!selectedId || view === "submitting") {
      return;
    }

    setView("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          participantId: selectedId,
          fingerprint: visitorId ?? ((await loadVisitorId()) || undefined),
        }),
      });

      if (response.status === 201) {
        setView("success");
        return;
      }

      if (response.status === 409) {
        setView("already_voted");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setErrorMessage(data?.error ?? "Something went wrong. Please try again.");
      setView("error");
    } catch {
      setErrorMessage("Network error. Check your connection and try again.");
      setView("error");
    }
  }, [selectedId, slug, view, visitorId]);

  if (view === "success") {
    return (
      <VoteStatusPanel
        title="Vote recorded"
        description="Thank you for voting. Results update live as more votes come in."
      >
        <Link href={`/results/${slug}`} className="w-full sm:w-auto">
          <Button className="w-full">View live results</Button>
        </Link>
      </VoteStatusPanel>
    );
  }

  if (view === "already_voted") {
    return (
      <VoteStatusPanel
        title="You have already voted"
        description="Only one vote is allowed per person for this event."
      >
        <Link href={`/results/${slug}`} className="w-full sm:w-auto">
          <Button variant="ghost" className="w-full">
            View results
          </Button>
        </Link>
      </VoteStatusPanel>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 text-center sm:mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Cast your vote
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {eventName}
        </h1>
        {eventDescription ? (
          <p className="mx-auto mt-3 max-w-xl text-base text-text-muted">
            {eventDescription}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-text-muted">
          Select one participant, then submit your vote.
        </p>
      </header>

      <Card className="overflow-hidden p-0">
        <ul role="radiogroup" aria-label="Participants" className="divide-y divide-border">
          {participants.map((participant, index) => {
            const isSelected = selectedId === participant.id;

            return (
              <li key={participant.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={view === "submitting"}
                  onClick={() => setSelectedId(participant.id)}
                  className={`flex w-full items-center gap-4 px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 ${
                    isSelected
                      ? "border-l-4 border-l-accent bg-accent/10"
                      : "border-l-4 border-l-transparent hover:bg-surface-raised"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isSelected
                        ? "bg-accent text-white"
                        : "bg-surface-raised text-text-muted"
                    }`}
                    aria-hidden
                  >
                    {index + 1}
                  </span>

                  <ParticipantAvatar
                    name={participant.name}
                    imageUrl={participant.imageUrl}
                    size="md"
                  />

                  <span className="min-w-0 flex-1 text-base font-semibold text-text-primary">
                    {participant.name}
                  </span>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-accent bg-accent"
                        : "border-text-muted bg-transparent"
                    }`}
                    aria-hidden
                  >
                    {isSelected ? <CheckIcon className="h-3 w-3 text-white" /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {view === "error" && errorMessage ? (
        <p
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        <Button
          onClick={submitVote}
          disabled={!selectedId || view === "submitting" || !fingerprintReady}
          className="min-h-12 w-full text-base"
        >
          {view === "submitting"
            ? "Submitting…"
            : !fingerprintReady
              ? "Preparing…"
              : "Submit vote"}
        </Button>

        <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <LockIcon />
            One vote per person
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldIcon />
            Voter data anonymised
          </span>
        </div>
      </div>
    </div>
  );
}

function VoteStatusPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <Card className="flex w-full flex-col items-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-accent">
          <CheckIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-text-primary">{title}</h1>
        <p className="mt-3 text-text-muted">{description}</p>
        <div className="mt-8 w-full">{children}</div>
      </Card>
    </div>
  );
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v-2a3 3 0 00-6 0v2h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

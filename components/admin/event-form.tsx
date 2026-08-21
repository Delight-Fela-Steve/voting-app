"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { EventActionState } from "@/lib/actions/events";
import {
  DURATION_UNIT_MS,
  formatCountdown,
  normalizeDuration,
  type DurationUnit,
} from "@/lib/datetime/duration";
import { useCountdown } from "@/lib/datetime/use-countdown";

type EventFormValues = {
  name: string;
  description: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getDefaultSchedule(): { startsAt: Date; endsAt: Date } {
  const now = new Date();
  return {
    startsAt: now,
    endsAt: new Date(now.getTime() + TWENTY_FOUR_HOURS_MS),
  };
}

function toDatetimeLocalValue(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocal(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function hasCustomSchedule(event?: EventFormValues): boolean {
  return Boolean(event?.startsAt || event?.endsAt);
}

function getInitialSchedule(event?: EventFormValues): {
  startsAt: string;
  endsAt: string;
} {
  if (event?.startsAt || event?.endsAt) {
    return {
      startsAt: toDatetimeLocalValue(event.startsAt),
      endsAt: toDatetimeLocalValue(event.endsAt),
    };
  }
  const defaults = getDefaultSchedule();
  return {
    startsAt: toDatetimeLocalValue(defaults.startsAt),
    endsAt: toDatetimeLocalValue(defaults.endsAt),
  };
}

function deriveDuration(
  startsAt: Date | null,
  endsAt: Date,
): { value: string; unit: DurationUnit } | null {
  let ms: number;
  if (startsAt) {
    ms = endsAt.getTime() - startsAt.getTime();
  } else {
    // Measured against "now", which is never on a minute boundary; round so
    // the derived value reads "1440 minutes" instead of "86392 seconds".
    ms = endsAt.getTime() - Date.now();
    if (ms >= 60_000) {
      ms = Math.round(ms / 60_000) * 60_000;
    }
  }
  const normalized = normalizeDuration(ms);
  if (!normalized) {
    return null;
  }
  return { value: String(normalized.value), unit: normalized.unit };
}

function getInitialDuration(event?: EventFormValues): {
  value: string;
  unit: DurationUnit;
} {
  if (event?.endsAt) {
    const derived = deriveDuration(event.startsAt, event.endsAt);
    if (derived) {
      return derived;
    }
  }
  return { value: "24", unit: "hours" };
}

type EventFormProps = {
  action: (
    prev: EventActionState,
    formData: FormData,
  ) => Promise<EventActionState>;
  submitLabel: string;
  event?: EventFormValues;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function EventForm({ action, submitLabel, event }: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [showCustomDate, setShowCustomDate] = useState(() =>
    hasCustomSchedule(event),
  );
  const [duration, setDuration] = useState(() => getInitialDuration(event));
  const [schedule, setSchedule] = useState(() => getInitialSchedule(event));
  const [justSaved, setJustSaved] = useState(false);
  const hiddenEndsAtRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!state.error) {
      setJustSaved(true);
    }
  }, [state]);

  const previewTarget = parseDatetimeLocal(schedule.endsAt)?.getTime() ?? null;
  const remainingMs = useCountdown(previewTarget);
  const startsAtDate = parseDatetimeLocal(schedule.startsAt);
  const untilStartMs = useCountdown(startsAtDate?.getTime() ?? null);
  const startsInFuture = untilStartMs !== null && untilStartMs > 0;

  function handleDurationChange(nextValue: string, nextUnit: DurationUnit) {
    setDuration({ value: nextValue, unit: nextUnit });

    const amount = Number.parseInt(nextValue, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const base = new Date();
    setSchedule((prev) => ({
      ...prev,
      startsAt: toDatetimeLocalValue(base),
      endsAt: toDatetimeLocalValue(
        new Date(base.getTime() + amount * DURATION_UNIT_MS[nextUnit]),
      ),
    }));
  }

  function handleStartsAtChange(next: string) {
    setSchedule((prev) => ({ ...prev, startsAt: next }));

    const endsAt = parseDatetimeLocal(schedule.endsAt);
    if (!endsAt) {
      return;
    }
    const derived = deriveDuration(parseDatetimeLocal(next), endsAt);
    if (derived) {
      setDuration(derived);
    }
  }

  function handleEndsAtChange(next: string) {
    setSchedule((prev) => ({ ...prev, endsAt: next }));

    const endsAt = parseDatetimeLocal(next);
    if (!endsAt) {
      return;
    }
    const derived = deriveDuration(
      parseDatetimeLocal(schedule.startsAt),
      endsAt,
    );
    if (derived) {
      setDuration(derived);
    }
  }

  function handleSubmit() {
    if (showCustomDate || !hiddenEndsAtRef.current) {
      return;
    }

    const amount = Number.parseInt(duration.value, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const base = parseDatetimeLocal(schedule.startsAt)?.getTime() ?? Date.now();
    hiddenEndsAtRef.current.value = new Date(
      base + amount * DURATION_UNIT_MS[duration.unit],
    ).toISOString();
  }

  return (
    <form
      action={formAction}
      className="space-y-5"
      onSubmit={handleSubmit}
      onChange={() => setJustSaved(false)}
    >
      <div className="space-y-1">
        <label htmlFor="name" className={labelClass}>
          Event name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={event?.name ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={event?.description ?? ""}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-muted">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={event?.isActive ?? true}
          className="h-4 w-4 rounded border-border bg-surface accent-accent"
        />
        Voting is active
      </label>

      <div className="space-y-3">
        <p className={labelClass}>Expires in</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            id="durationValue"
            type="number"
            min={1}
            required
            value={duration.value}
            onChange={(e) => handleDurationChange(e.target.value, duration.unit)}
            className={inputClass}
            aria-label="Duration amount"
          />
          <select
            id="durationUnit"
            value={duration.unit}
            onChange={(e) =>
              handleDurationChange(duration.value, e.target.value as DurationUnit)
            }
            className={inputClass}
            aria-label="Duration unit"
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomDate((prev) => !prev)}
          className="flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <svg
            className="h-4 w-4 shrink-0 transition-transform"
            style={{ transform: showCustomDate ? "rotate(90deg)" : undefined }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          Set custom date and time
        </button>

        {showCustomDate ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="startsAt" className={labelClass}>
                Starts at (optional)
              </label>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                value={schedule.startsAt}
                onChange={(e) => handleStartsAtChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="endsAt" className={labelClass}>
                Ends at (optional)
              </label>
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                value={schedule.endsAt}
                onChange={(e) => handleEndsAtChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="startsAt" value={schedule.startsAt} />
            <input ref={hiddenEndsAtRef} type="hidden" name="endsAt" />
          </>
        )}

        {remainingMs !== null ? (
          <p className="text-sm text-text-muted">
            {remainingMs > 0 ? (
              <>
                Ends in{" "}
                <span className="font-medium tabular-nums text-text-primary">
                  {formatCountdown(remainingMs)}
                </span>
                {startsInFuture && startsAtDate
                  ? ` (starts ${formatDateTime(startsAtDate)})`
                  : null}
              </>
            ) : (
              "Already ended"
            )}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        variant={justSaved ? "success" : "primary"}
      >
        {pending ? "Saving…" : justSaved ? "Saved" : submitLabel}
      </Button>
    </form>
  );
}

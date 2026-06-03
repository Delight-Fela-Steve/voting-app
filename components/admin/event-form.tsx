"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { EventActionState } from "@/lib/actions/events";

type EventFormValues = {
  name: string;
  description: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

type DurationUnit = "seconds" | "minutes" | "hours" | "days";

const DURATION_MULTIPLIERS: Record<DurationUnit, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
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

function hasCustomSchedule(event?: EventFormValues): boolean {
  return Boolean(event?.startsAt || event?.endsAt);
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
  const [durationValue, setDurationValue] = useState("24");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("hours");
  const hiddenEndsAtRef = useRef<HTMLInputElement>(null);

  const defaultSchedule = useMemo(
    () => (event?.startsAt || event?.endsAt ? null : getDefaultSchedule()),
    [event?.startsAt, event?.endsAt],
  );

  function handleSubmit() {
    if (showCustomDate || !hiddenEndsAtRef.current) {
      return;
    }

    const amount = Number.parseInt(durationValue, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    hiddenEndsAtRef.current.value = new Date(
      Date.now() + amount * DURATION_MULTIPLIERS[durationUnit],
    ).toISOString();
  }

  return (
    <form
      action={formAction}
      className="space-y-5"
      onSubmit={handleSubmit}
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
            value={durationValue}
            onChange={(e) => setDurationValue(e.target.value)}
            className={inputClass}
            aria-label="Duration amount"
          />
          <select
            id="durationUnit"
            value={durationUnit}
            onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
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
          <span
            className="inline-block transition-transform"
            style={{ transform: showCustomDate ? "rotate(90deg)" : undefined }}
            aria-hidden
          >
            ▶
          </span>
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
                defaultValue={toDatetimeLocalValue(
                  event?.startsAt ?? defaultSchedule?.startsAt,
                )}
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
                defaultValue={toDatetimeLocalValue(
                  event?.endsAt ?? defaultSchedule?.endsAt,
                )}
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <input ref={hiddenEndsAtRef} type="hidden" name="endsAt" />
        )}
      </div>

      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

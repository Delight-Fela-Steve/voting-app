"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import type { ParticipantActionState } from "@/lib/actions/participants";

type ParticipantFormProps = {
  action: (
    prev: ParticipantActionState,
    formData: FormData,
  ) => Promise<ParticipantActionState>;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function ParticipantForm({ action }: ParticipantFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1">
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Participant name"
          className={inputClass}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <label htmlFor="imageUrl" className={labelClass}>
          Image URL (optional)
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://…"
          className={inputClass}
        />
      </div>
      <Button type="submit" disabled={pending} variant="ghost" className="shrink-0">
        {pending ? "Adding…" : "Add participant"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-red-400 sm:col-span-3" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

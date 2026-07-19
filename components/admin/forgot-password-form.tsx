"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/lib/actions/password-reset";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    ForgotPasswordState,
    FormData
  >(requestPasswordReset, {});

  if (state.success) {
    return (
      <p
        className="rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-sm text-live"
        role="status"
      >
        If an account exists for that email, we&apos;ve sent a password reset
        link. Check your inbox.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1 text-left">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending link…" : "Send reset link"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import {
  acceptInvitation,
  type RegisterActionState,
} from "@/lib/actions/users";

type RegisterFormProps = {
  token: string;
  lockedEmail: string | null;
  invitedByName: string;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent read-only:bg-surface-raised";
const labelClass = "block text-sm font-medium text-text-muted";

export function RegisterForm({
  token,
  lockedEmail,
  invitedByName,
}: RegisterFormProps) {
  const boundAction = acceptInvitation.bind(null, token);
  const [state, formAction, pending] = useActionState<
    RegisterActionState,
    FormData
  >(boundAction, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <p className="text-sm text-text-muted">
        Invited by{" "}
        <span className="font-medium text-text-primary">{invitedByName}</span>
      </p>

      <div className="space-y-1">
        <label htmlFor="name" className={labelClass}>
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          readOnly={!!lockedEmail}
          defaultValue={lockedEmail ?? ""}
          className={inputClass}
        />
        {lockedEmail ? (
          <p className="text-xs text-text-muted">
            This invitation is locked to this email address.
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
        <p className="text-xs text-text-muted">At least 8 characters.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create admin account"}
      </Button>
    </form>
  );
}

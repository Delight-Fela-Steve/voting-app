"use client";

import { useActionState } from "react";
import { Button, PasswordInput } from "@/components/ui";
import {
  resetPassword,
  type ResetPasswordState,
} from "@/lib/actions/password-reset";

type ResetPasswordFormProps = {
  token: string;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const boundAction = resetPassword.bind(null, token);
  const [state, formAction, pending] = useActionState<
    ResetPasswordState,
    FormData
  >(boundAction, {});

  return (
    <form action={formAction} className="mt-6 space-y-4 text-left">
      <div className="space-y-1">
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
        <p className="text-xs text-text-muted">At least 8 characters.</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm new password
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
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
        {pending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}

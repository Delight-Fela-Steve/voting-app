"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type OtpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maskedEmail: string;
  onSubmit: (code: string) => Promise<void>;
  pending?: boolean;
  error?: string | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-center text-lg tracking-[0.4em] text-text-primary outline-none focus:ring-2 focus:ring-accent";

export function OtpDialog({
  open,
  onOpenChange,
  maskedEmail,
  onSubmit,
  pending = false,
  error = null,
}: OtpDialogProps) {
  const [code, setCode] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCode("");
    }
    onOpenChange(nextOpen);
  }

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(code.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="otp-dialog-title"
          className="text-lg font-semibold text-text-primary"
        >
          Enter verification code
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          An OTP has been sent to{" "}
          <span className="font-medium text-text-primary">{maskedEmail}</span>.
          Enter the 6-digit code below.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="sr-only">Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
              placeholder="000000"
              disabled={pending}
            />
          </label>

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || code.length !== 6}>
              {pending ? "Verifying…" : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  confirmEmailChange,
  requestEmailChange,
} from "@/lib/actions/profile";
import { OtpDialog } from "@/components/admin/otp-dialog";
import { Button } from "@/components/ui";

type ProfileEmailSectionProps = {
  email: string;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent";

export function ProfileEmailSection({ email }: ProfileEmailSectionProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConfirming, startConfirmTransition] = useTransition();

  function handleStartChange() {
    setIsChanging(true);
    setNewEmail("");
    setError(null);
  }

  function handleCancelChange() {
    setIsChanging(false);
    setNewEmail("");
    setError(null);
  }

  function handleRequestChange() {
    startTransition(async () => {
      const result = await requestEmailChange(newEmail);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.otpSent && result.maskedEmail) {
        setMaskedEmail(result.maskedEmail);
        setOtpOpen(true);
        setOtpError(null);
        setIsChanging(false);
        setError(null);
      }
    });
  }

  async function handleConfirmOtp(code: string): Promise<void> {
    startConfirmTransition(async () => {
      const result = await confirmEmailChange(code);

      if (result.error) {
        setOtpError(result.error);
        return;
      }

      setOtpOpen(false);
    });
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 px-4 py-3">
        <dt className="text-sm font-medium text-text-muted">Email</dt>
        <dd className="col-span-2 text-sm text-text-primary">
          {isChanging ? (
            <div className="space-y-3">
              <p className="text-text-muted">Current: {email}</p>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                placeholder="New email address"
                autoComplete="email"
                disabled={isPending}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleRequestChange}
                  disabled={isPending || !newEmail.trim()}
                >
                  {isPending ? "Sending…" : "Submit"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelChange}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
              {error ? (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <span>{email}</span>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 px-3 py-1.5 text-xs"
                onClick={handleStartChange}
              >
                Change email
              </Button>
            </div>
          )}
        </dd>
      </div>

      {otpOpen ? (
        <OtpDialog
          open
          onOpenChange={setOtpOpen}
          maskedEmail={maskedEmail}
          onSubmit={handleConfirmOtp}
          pending={isConfirming}
          error={otpError}
        />
      ) : null}
    </>
  );
}

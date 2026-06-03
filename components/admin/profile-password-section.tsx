"use client";

import { useState, useTransition } from "react";
import {
  confirmPasswordChange,
  requestPasswordChange,
} from "@/lib/actions/profile";
import { OtpDialog } from "@/components/admin/otp-dialog";
import { Button, Card } from "@/components/ui";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent";
const labelClass = "block text-sm font-medium text-text-muted";

export function ProfilePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConfirming, startConfirmTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await requestPasswordChange(
        currentPassword,
        newPassword,
        confirmNewPassword,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.otpSent && result.maskedEmail) {
        setMaskedEmail(result.maskedEmail);
        setOtpOpen(true);
        setOtpError(null);
      }
    });
  }

  async function handleConfirmOtp(code: string): Promise<void> {
    startConfirmTransition(async () => {
      const result = await confirmPasswordChange(code);

      if (result.error) {
        setOtpError(result.error);
        return;
      }

      setOtpOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setOtpError(null);
      setError(null);
      setSuccess(result.success ?? "Password updated successfully.");
    });
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Change password
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          You will receive a verification code by email to confirm the change.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="current-password" className={labelClass}>
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="new-password" className={labelClass}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm-new-password" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={inputClass}
              disabled={isPending}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="text-sm text-green-500" role="status">
              {success}
            </p>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending code…" : "Submit"}
          </Button>
        </form>
      </Card>

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

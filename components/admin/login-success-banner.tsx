"use client";

import { useSearchParams } from "next/navigation";

export function LoginSuccessBanner() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const emailChanged = searchParams.get("email_changed") === "1";

  if (!registered && !emailChanged) {
    return null;
  }

  const message = emailChanged
    ? "Email updated successfully. Sign in with your new email address."
    : "Account created successfully. Sign in with your new credentials.";

  return (
    <p
      className="mt-4 rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-sm text-live"
      role="status"
    >
      {message}
    </p>
  );
}

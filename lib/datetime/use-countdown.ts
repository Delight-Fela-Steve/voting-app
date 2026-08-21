"use client";

import { useEffect, useState } from "react";

/**
 * Milliseconds remaining until the target epoch timestamp, recomputed every
 * second. Returns null on the server, before the first client tick, and when
 * the target is null. The result can go negative once the target passes;
 * callers use `<= 0` to detect an ended state.
 */
export function useCountdown(targetMs: number | null): number | null {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () =>
      setRemainingMs(targetMs == null ? null : targetMs - Date.now());

    // Deferred so the effect body itself never sets state synchronously.
    const timeoutId = setTimeout(update, 0);
    const intervalId =
      targetMs == null ? undefined : setInterval(update, 1_000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [targetMs]);

  return remainingMs;
}

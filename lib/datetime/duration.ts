export type DurationUnit = "seconds" | "minutes" | "hours" | "days";

export const DURATION_UNIT_MS: Record<DurationUnit, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

/**
 * Convert a millisecond duration into the largest unit that represents it
 * exactly: 24h -> 1 day, 25h -> 25 hours, 90min -> 90 minutes, 45s -> 45 seconds.
 * Returns null for non-finite or non-positive durations.
 */
export function normalizeDuration(
  ms: number,
): { value: number; unit: DurationUnit } | null {
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }

  const seconds = Math.round(ms / 1_000);
  if (seconds <= 0) {
    return null;
  }

  if (seconds % SECONDS_PER_DAY === 0) {
    return { value: seconds / SECONDS_PER_DAY, unit: "days" };
  }
  if (seconds % SECONDS_PER_HOUR === 0) {
    return { value: seconds / SECONDS_PER_HOUR, unit: "hours" };
  }
  if (seconds % SECONDS_PER_MINUTE === 0) {
    return { value: seconds / SECONDS_PER_MINUTE, unit: "minutes" };
  }
  return { value: seconds, unit: "seconds" };
}

/**
 * Format a remaining-time duration as "1d 4h 23m 10s", omitting leading zero
 * units. Negative durations clamp to "0s".
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1_000));

  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor(
    (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (parts.length > 0 || hours > 0) {
    parts.push(`${hours}h`);
  }
  if (parts.length > 0 || minutes > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

export type GeolocationResult =
  | { ok: true; latitude: number; longitude: number; accuracy: number }
  | { ok: false; reason: "denied" | "unavailable" | "timeout" | "unsupported" };

const SAMPLE_WINDOW_MS = 12_000;
const GOOD_ENOUGH_ACCURACY_METERS = 30;

/**
 * Browsers let the user pick "Approximate" location regardless of what a
 * site requests (enableHighAccuracy only influences the dialog's default
 * selection). A fix coarser than this radius likely came from that choice
 * and is too unreliable to trust for a geofence check.
 */
export const MAX_VOTE_LOCATION_ACCURACY_METERS = 100;

/**
 * Wraps navigator.geolocation.watchPosition in a promise, sampling fixes for
 * up to SAMPLE_WINDOW_MS and keeping the most accurate one seen. A single
 * getCurrentPosition call often returns the first (coarse) fix a device can
 * produce rather than waiting for GPS to refine; watching for a few seconds
 * and keeping the best sample gets closer to the device's real ceiling.
 * Always resolves (never rejects) so callers can branch on `ok` without
 * try/catch.
 */
export function requestVoterLocation(): Promise<GeolocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    let best: { latitude: number; longitude: number; accuracy: number } | null = null;
    let settled = false;
    let watchId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const finish = (result: GeolocationResult) => {
      if (settled) {
        return;
      }
      settled = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      resolve(result);
    };

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (!best || accuracy < best.accuracy) {
          best = { latitude, longitude, accuracy };
        }
        if (accuracy <= GOOD_ENOUGH_ACCURACY_METERS) {
          finish({ ok: true, ...best });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          finish({ ok: false, reason: "denied" });
        } else if (best) {
          finish({ ok: true, ...best });
        } else if (error.code === error.TIMEOUT) {
          finish({ ok: false, reason: "timeout" });
        } else {
          finish({ ok: false, reason: "unavailable" });
        }
      },
      { enableHighAccuracy: true, timeout: SAMPLE_WINDOW_MS, maximumAge: 0 },
    );

    timeoutId = setTimeout(() => {
      finish(best ? { ok: true, ...best } : { ok: false, reason: "timeout" });
    }, SAMPLE_WINDOW_MS);
  });
}

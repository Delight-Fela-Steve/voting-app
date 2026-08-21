export type GeolocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; reason: "denied" | "unavailable" | "timeout" | "unsupported" };

/**
 * Wraps navigator.geolocation.getCurrentPosition in a promise. Always resolves
 * (never rejects) so callers can branch on `ok` without try/catch.
 */
export function requestVoterLocation(): Promise<GeolocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ ok: false, reason: "denied" });
        } else if (error.code === error.TIMEOUT) {
          resolve({ ok: false, reason: "timeout" });
        } else {
          resolve({ ok: false, reason: "unavailable" });
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

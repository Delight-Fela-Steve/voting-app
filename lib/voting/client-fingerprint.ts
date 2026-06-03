import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedVisitorId: string | null = null;
let loadPromise: Promise<string> | null = null;

/**
 * Loads FingerprintJS once per tab and returns the visitorId (F6).
 * Returns empty string if fingerprinting fails; server falls back to IP-only voterKey.
 */
export async function loadVisitorId(): Promise<string> {
  if (cachedVisitorId !== null) {
    return cachedVisitorId;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const agent = await FingerprintJS.load();
        const { visitorId } = await agent.get();
        cachedVisitorId = visitorId;
        return visitorId;
      } catch {
        cachedVisitorId = "";
        return "";
      }
    })();
  }

  return loadPromise;
}

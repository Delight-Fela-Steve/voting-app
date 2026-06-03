import { createHash } from "crypto";

/**
 * SHA-256(visitorId:ip:eventId). When fingerprint is missing, uses "anonymous"
 * so the key is effectively IP + event scoped (F6 fallback).
 */
export function buildVoterKey(
  eventId: string,
  fingerprint: string | undefined,
  ipAddress: string
): string {
  const visitorId = fingerprint?.trim() || "anonymous";
  const payload = `${visitorId}:${ipAddress}:${eventId}`;
  return createHash("sha256").update(payload).digest("hex");
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}

import { headers } from "next/headers";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Base URL for public vote/results links (server or env). */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/** Resolve base URL from incoming request headers when available. */
export async function getRequestBaseUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) {
    return getAppBaseUrl();
  }
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function getVoteUrl(slug: string, baseUrl?: string): string {
  const base = trimTrailingSlash(baseUrl ?? getAppBaseUrl());
  return `${base}/vote/${slug}`;
}

export function getResultsUrl(slug: string, baseUrl?: string): string {
  const base = trimTrailingSlash(baseUrl ?? getAppBaseUrl());
  return `${base}/results/${slug}`;
}

export function getRegisterInviteUrl(token: string, baseUrl?: string): string {
  const base = trimTrailingSlash(baseUrl ?? getAppBaseUrl());
  return `${base}/admin/register?token=${encodeURIComponent(token)}`;
}

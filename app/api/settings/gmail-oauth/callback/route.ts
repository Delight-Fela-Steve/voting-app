import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canEncrypt, encrypt } from "@/lib/email/encrypt";
import { EMAIL_CONFIG_SINGLETON_ID } from "@/lib/email/email-config-id";
import { prisma } from "@/lib/prisma";
import { getRequestBaseUrl } from "@/lib/urls";

const OAUTH_STATE_COOKIE = "gmail_oauth_state";
const OAUTH_FROM_NAME_COOKIE = "gmail_oauth_from_name";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
};

function settingsRedirect(
  baseUrl: string,
  params: Record<string, string>,
): NextResponse {
  const url = new URL("/admin/settings", baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const session = await auth();
  const baseUrl = await getRequestBaseUrl();

  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", baseUrl));
  }

  if (!canEncrypt()) {
    return settingsRedirect(baseUrl, {
      error: "encryption_not_configured",
    });
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return settingsRedirect(baseUrl, { error: "oauth_denied" });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const fromName =
    cookieStore.get(OAUTH_FROM_NAME_COOKIE)?.value?.trim() || "Voting App";

  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_FROM_NAME_COOKIE);

  if (!code || !state || !storedState || state !== storedState) {
    return settingsRedirect(baseUrl, { error: "oauth_invalid_state" });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return settingsRedirect(baseUrl, { error: "oauth_not_configured" });
  }

  const redirectUri = `${baseUrl}/api/settings/gmail-oauth/callback`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokens.access_token) {
    return settingsRedirect(baseUrl, { error: "oauth_token_failed" });
  }

  if (!tokens.refresh_token) {
    return settingsRedirect(baseUrl, { error: "oauth_no_refresh_token" });
  }

  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    },
  );

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

  if (!userInfoResponse.ok || !userInfo.email) {
    return settingsRedirect(baseUrl, { error: "oauth_profile_failed" });
  }

  const tokenExpiry =
    typeof tokens.expires_in === "number"
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

  await prisma.emailConfig.upsert({
    where: { id: EMAIL_CONFIG_SINGLETON_ID },
    create: {
      id: EMAIL_CONFIG_SINGLETON_ID,
      provider: "GMAIL_OAUTH",
      fromName,
      fromEmail: userInfo.email.toLowerCase(),
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiry,
      appPassword: null,
    },
    update: {
      provider: "GMAIL_OAUTH",
      fromName,
      fromEmail: userInfo.email.toLowerCase(),
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiry,
      appPassword: null,
    },
  });

  return settingsRedirect(baseUrl, { success: "gmail_connected" });
}

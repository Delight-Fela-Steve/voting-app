import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRequestBaseUrl } from "@/lib/urls";

const OAUTH_STATE_COOKIE = "gmail_oauth_state";
const OAUTH_FROM_NAME_COOKIE = "gmail_oauth_from_name";
const STATE_MAX_AGE = 600;

export async function GET(request: Request) {
  const session = await auth();

  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/admin/settings?error=oauth_not_configured", request.url),
    );
  }

  const url = new URL(request.url);
  const fromName = url.searchParams.get("fromName")?.trim() || "Voting App";

  const state = randomBytes(24).toString("hex");
  const baseUrl = await getRequestBaseUrl();
  const redirectUri = `${baseUrl}/api/settings/gmail-oauth/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set(
    "scope",
    [
      "https://mail.google.com/",
      "email",
      "profile",
      "openid",
    ].join(" "),
  );
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_MAX_AGE,
    path: "/",
  });
  cookieStore.set(OAUTH_FROM_NAME_COOKIE, fromName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_MAX_AGE,
    path: "/",
  });

  return NextResponse.redirect(authUrl.toString());
}

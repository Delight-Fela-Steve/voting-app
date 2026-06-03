import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname.startsWith("/admin/register");

  if (!isLoggedIn && !isPublicAdminRoute) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    if (pathname !== "/admin") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

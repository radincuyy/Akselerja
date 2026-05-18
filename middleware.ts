import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  // Candidate-only MVP: /hr is gone, but in case any user lands on a stale
  // bookmark we send them to the candidate app instead of returning 404.
  if (path.startsWith("/hr")) {
    return NextResponse.redirect(new URL("/app", nextUrl.origin));
  }

  const isProtected =
    path.startsWith("/app") || path.startsWith("/onboarding");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/masuk", nextUrl.origin);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/hr/:path*", "/onboarding/:path*", "/onboarding"],
};

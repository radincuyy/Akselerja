import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  const isProtected =
    path.startsWith("/app") ||
    path.startsWith("/hr") ||
    path.startsWith("/onboarding");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/masuk", nextUrl.origin);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && req.auth?.user) {
    const role = req.auth.user.role;
    if (path.startsWith("/hr") && role !== "company") {
      return NextResponse.redirect(new URL("/app", nextUrl.origin));
    }
    if (
      (path.startsWith("/app") || path.startsWith("/onboarding")) &&
      role === "company"
    ) {
      return NextResponse.redirect(new URL("/hr", nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/hr/:path*", "/onboarding/:path*", "/onboarding"],
};

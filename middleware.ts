import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // Candidate-only MVP: /hr is gone, but in case any user lands on a stale
  // bookmark we send them to the candidate app instead of returning 404.
  if (path.startsWith("/hr")) {
    return NextResponse.redirect(new URL("/app", nextUrl.origin));
  }

  const isProtected =
    path.startsWith("/app") || path.startsWith("/onboarding");
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  if (!token) {
    const url = new URL("/masuk", nextUrl.origin);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/hr/:path*", "/onboarding/:path*", "/onboarding"],
};

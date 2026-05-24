import { NextResponse, type NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // Candidate-only MVP: /hr is gone, but in case any user lands on a stale
  // bookmark we send them to the candidate app instead of returning 404.
  if (path.startsWith("/hr")) {
    return NextResponse.redirect(new URL("/app", nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hr/:path*"],
};

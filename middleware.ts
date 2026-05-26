import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_API_PREFIX = "/api/";
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/test/"];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  if (path.startsWith("/hr")) {
    return NextResponse.redirect(new URL("/app", nextUrl.origin));
  }

  if (
    path.startsWith(PROTECTED_API_PREFIX) &&
    !PUBLIC_API_PREFIXES.some((prefix) => path.startsWith(prefix))
  ) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie:
        process.env.NODE_ENV === "production" &&
        process.env.E2E_MODE !== "true",
    });
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hr/:path*", "/api/:path*"],
};

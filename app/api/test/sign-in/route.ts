import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.E2E_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { userId?: string; email?: string; name?: string }
    | null;
  if (!body?.userId || !body.email) {
    return NextResponse.json(
      { error: "userId and email required" },
      { status: 400 },
    );
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "AUTH_SECRET missing" },
      { status: 500 },
    );
  }

  const cookieName = "authjs.session-token";

  const token = await encode({
    token: {
      id: body.userId,
      sub: body.userId,
      name: body.name ?? "E2E User",
      email: body.email,
    },
    secret,
    salt: cookieName,
    maxAge: 60 * 60,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60,
  });
  return res;
}

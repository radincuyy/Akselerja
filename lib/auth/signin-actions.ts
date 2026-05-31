"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { checkRateLimit, retryAfterMessage } from "./rate-limit";

export type LoginResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function safeCallbackUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function toRelativeUrl(value: string, fallback: string): string {
  try {
    const parsed = new URL(value, "http://localhost");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export async function loginWithEmailPassword(input: {
  email: string;
  password: string;
  callbackUrl?: string;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const callbackUrl = safeCallbackUrl(input.callbackUrl, "/app");

  if (!email || !password) {
    return { ok: false, error: "Isi email dan password terlebih dahulu." };
  }

  const limit = checkRateLimit("login", email, {
    max: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return {
      ok: false,
      error: `Terlalu banyak percobaan masuk. ${retryAfterMessage(limit.retryAfterSec)}`,
    };
  }

  try {
    const url = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: callbackUrl,
    });
    const redirectUrl = toRelativeUrl(String(url), callbackUrl);
    const parsed = new URL(redirectUrl, "http://localhost");
    if (parsed.searchParams.has("error")) {
      return { ok: false, error: "Email atau password salah. Coba lagi." };
    }
    return { ok: true, url: redirectUrl };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Email atau password salah. Coba lagi." };
    }
    throw err;
  }
}

export async function signInWithGoogle(): Promise<void> {
  await signIn("google", { redirectTo: "/app" });
}

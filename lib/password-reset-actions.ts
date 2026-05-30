"use server";

import { isPasswordValid, PASSWORD_RULE_ERROR } from "./password-rules";
import {
  createPasswordResetToken,
  resetUserPasswordWithToken,
} from "./user-store";
import { isResendConfigured, sendPasswordResetEmail } from "./resend-email";

const RESET_TOKEN_TTL_MINUTES = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RequestPasswordResetResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export type ConfirmPasswordResetResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getAppBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL;

  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";

  throw new Error(
    "APP_URL, AUTH_URL, NEXTAUTH_URL, atau NEXT_PUBLIC_APP_URL belum dikonfigurasi.",
  );
}

function buildResetUrl(email: string, token: string, baseUrl: string): string {
  const url = new URL("/reset-password", baseUrl);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<RequestPasswordResetResult> {
  const email = normalizeEmail(input.email);

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Format email belum benar." };
  }

  if (!isResendConfigured()) {
    return {
      ok: false,
      error: "Layanan email reset belum dikonfigurasi. Hubungi admin.",
    };
  }

  let baseUrl: string;
  try {
    baseUrl = getAppBaseUrl();
  } catch (err) {
    console.error("[password-reset] app url missing", err);
    return {
      ok: false,
      error: "Alamat aplikasi belum dikonfigurasi. Hubungi admin.",
    };
  }

  const tokenResult = await createPasswordResetToken(
    email,
    RESET_TOKEN_TTL_MINUTES,
  );

  if (!tokenResult.ok) {
    if (tokenResult.reason === "not-found") {
      return { ok: true, email };
    }
    if (tokenResult.reason === "cosmos-not-configured") {
      return {
        ok: false,
        error: "Database belum terkonfigurasi. Hubungi admin.",
      };
    }

    console.error("[password-reset] token creation failed", tokenResult.message);
    return {
      ok: false,
      error: "Permintaan reset belum bisa diproses. Coba lagi sebentar lagi.",
    };
  }

  const resetUrl = buildResetUrl(
    tokenResult.user.email,
    tokenResult.token,
    baseUrl,
  );

  try {
    await sendPasswordResetEmail({
      to: tokenResult.user.email,
      name: tokenResult.user.name,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
    });
  } catch (err) {
    console.error("[password-reset] resend failed", err);
    return {
      ok: false,
      error: "Email reset belum bisa dikirim. Coba lagi sebentar lagi.",
    };
  }

  return { ok: true, email };
}

export async function confirmPasswordReset(input: {
  email: string;
  token: string;
  password: string;
}): Promise<ConfirmPasswordResetResult> {
  const email = normalizeEmail(input.email);
  const token = input.token.trim();

  if (!EMAIL_PATTERN.test(email) || !token) {
    return {
      ok: false,
      error: "Tautan reset tidak valid. Minta tautan baru dari halaman lupa password.",
    };
  }

  if (!isPasswordValid(input.password)) {
    return { ok: false, error: PASSWORD_RULE_ERROR };
  }

  const result = await resetUserPasswordWithToken({
    email,
    token,
    password: input.password,
  });

  if (result.ok) return { ok: true };

  if (result.reason === "cosmos-not-configured") {
    return {
      ok: false,
      error: "Database belum terkonfigurasi. Hubungi admin.",
    };
  }

  if (result.reason === "cosmos-error") {
    console.error("[password-reset] password update failed", result.message);
    return {
      ok: false,
      error: "Password belum bisa disimpan. Coba lagi sebentar lagi.",
    };
  }

  return {
    ok: false,
    error:
      result.reason === "expired-token"
        ? "Tautan reset sudah kadaluarsa. Minta tautan baru dari halaman lupa password."
        : "Tautan reset tidak valid. Minta tautan baru dari halaman lupa password.",
  };
}

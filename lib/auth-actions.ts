"use server";

import { createUserWithPassword } from "./user-store";
import { isPasswordValid, PASSWORD_RULE_ERROR } from "./password-rules";

export type SignupResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

const DEMO_DOMAIN = "@akselerja.demo";

export async function signupWithEmailPassword(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SignupResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { ok: false, error: "Nama tidak boleh kosong." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Email tidak valid." };
  }
  if (email.endsWith(DEMO_DOMAIN)) {
    return {
      ok: false,
      error: "Domain ini dipakai untuk akun demo. Gunakan email lain.",
    };
  }
  if (!isPasswordValid(password)) {
    return { ok: false, error: PASSWORD_RULE_ERROR };
  }

  const result = await createUserWithPassword({ name, email, password });
  if (!result.ok) {
    if (result.reason === "email-taken") {
      return {
        ok: false,
        error: "Email ini sudah terdaftar. Coba masuk atau pakai email lain.",
      };
    }
    if (result.reason === "cosmos-not-configured") {
      return {
        ok: false,
        error: "Database belum terkonfigurasi. Hubungi admin.",
      };
    }
    return {
      ok: false,
      error:
        "Tidak bisa menyimpan akun ke database. Coba lagi sebentar lagi.",
    };
  }

  return { ok: true, email: result.user.email };
}

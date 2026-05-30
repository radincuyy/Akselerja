"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/password-reset-actions";

export default function LupaPasswordPage() {
  const emailId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email belum benar.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordReset({ email });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(result.email);
    } catch {
      setError("Permintaan reset belum bisa diproses. Coba lagi sebentar lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 sm:px-8">
      <Link
        href="/masuk"
        className="inline-flex items-center gap-1.5 text-sm text-(--color-muted) hover:text-(--color-ink)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M9 4 5 7l4 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Kembali ke halaman masuk
      </Link>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
        Lupa password
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
        Tulis email yang kamu pakai untuk mendaftar. Kami akan kirim tautan
        untuk mengatur ulang password. Cek folder spam kalau email tidak
        muncul dalam 5 menit.
      </p>

      {sent ? (
        <div
          role="status"
          className="mt-8 rounded-lg border border-(--color-line) bg-(--color-tint) p-5"
        >
          <p className="text-sm font-semibold text-(--color-ink)">
            Tautan dikirim
          </p>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Kalau <span className="font-medium text-(--color-ink)">{sent}</span>{" "}
            terdaftar di Akselerja, kamu akan menerima email berisi tautan
            untuk mengatur ulang password. Tautan berlaku 30 menit.
          </p>
          <Link
            href="/masuk"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
          >
            Kembali ke halaman masuk →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={emailId}
              className="text-xs font-medium tracking-wide text-(--color-muted)"
            >
              Email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="kamu@email.com"
              className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-(--color-signal-clay)">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-3 text-base font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
          >
            {submitting ? "Mengirim…" : "Kirim tautan reset"}
          </button>
        </form>
      )}
    </main>
  );
}

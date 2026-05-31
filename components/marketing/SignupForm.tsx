"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  variant?: "light" | "dark";
  ctaLabel?: string;
};

export default function SignupForm({
  variant = "light",
  ctaLabel = "Daftar gratis",
}: Props) {
  const router = useRouter();
  const emailId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = variant === "dark";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();

    if (!email) {
      setError("Masukkan email kamu dulu.");
      return;
    }
    if (!email.includes("@")) {
      setError("Format email belum benar.");
      return;
    }

    setSubmitting(true);
    router.push(`/daftar/kandidat?email=${encodeURIComponent(email)}`);
  }

  const fieldClass = isDark
    ? "w-full rounded-md border border-(--color-line-on-teal) bg-(--color-teal-deep) px-3.5 py-2.5 text-base text-(--color-paper-on-teal) placeholder:text-(--color-muted-on-teal) transition-colors focus:border-(--color-paper-on-teal)"
    : "w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) transition-colors focus:border-(--color-teal)";

  const labelClass = isDark
    ? "text-xs font-medium tracking-wide text-(--color-muted-on-teal)"
    : "text-xs font-medium tracking-wide text-(--color-muted)";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3"
      aria-describedby={error ? `${emailId}-error` : undefined}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className={labelClass}>
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="kamu@email.com"
          className={fieldClass}
        />
      </div>

      {error && (
        <p
          id={`${emailId}-error`}
          role="alert"
          className={
            isDark
              ? "text-sm text-(--color-paper-on-teal)"
              : "text-sm text-(--color-signal-clay)"
          }
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={
          isDark
            ? "mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-(--color-paper-on-teal) px-5 py-3 text-base font-semibold text-(--color-teal-band) transition-colors hover:bg-(--color-paper) disabled:opacity-60"
            : "mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-3 text-base font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
        }
      >
        {submitting ? "Menyiapkan…" : ctaLabel}
        {!submitting && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <p
        className={
          isDark
            ? "text-xs text-(--color-muted-on-teal)"
            : "text-xs text-(--color-muted)"
        }
      >
        Lanjut isi nama, password, dan profil di langkah berikutnya. Gratis.
      </p>
    </form>
  );
}

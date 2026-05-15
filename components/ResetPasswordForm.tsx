"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const tokenPresent = Boolean(sp.get("token"));
  const pwId = useId();
  const pw2Id = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const pw = String(data.get("password") ?? "");
    const pw2 = String(data.get("confirm") ?? "");
    if (pw.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (pw !== pw2) {
      setError("Password baru dan konfirmasi tidak sama.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push("/masuk?reset=1");
  }

  if (!tokenPresent) {
    return (
      <div
        role="alert"
        className="mt-8 rounded-lg border border-(--color-signal-clay) bg-(--color-tint) p-5"
      >
        <p className="text-sm font-semibold text-(--color-ink)">
          Tautan tidak valid
        </p>
        <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
          Tautan reset tidak ditemukan atau sudah kadaluarsa. Minta tautan
          baru dari halaman lupa password.
        </p>
        <Link
          href="/lupa-password"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
        >
          Minta tautan baru →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={pwId}
          className="text-xs font-medium tracking-wide text-(--color-muted)"
        >
          Password baru
        </label>
        <input
          id={pwId}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={pw2Id}
          className="text-xs font-medium tracking-wide text-(--color-muted)"
        >
          Ulangi password baru
        </label>
        <input
          id={pw2Id}
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
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
        {submitting ? "Menyimpan…" : "Simpan password baru"}
      </button>
    </form>
  );
}

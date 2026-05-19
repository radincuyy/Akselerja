"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function CoachError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Akselerja /app/coach] error", error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
        Coach bermasalah
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
        Coach belum bisa diajak ngobrol
      </h1>
      <p className="mt-4 leading-relaxed text-(--color-muted)">
        Mungkin kuota harian sudah penuh atau koneksi sedang lambat. Riwayat
        chat tetap aman dan akan muncul lagi saat kamu coba lagi.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
        >
          Coba lagi
        </button>
        <Link
          href="/app"
          className="rounded-md border border-(--color-line) px-5 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
        >
          Ke beranda
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-8 text-xs text-(--color-muted)">
          Kode referensi: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </section>
  );
}

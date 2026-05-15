"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[Akselerja] root error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5 py-16 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
        Ada yang salah di sisi kami
      </p>
      <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)">
        Halaman tidak bisa dimuat
      </h1>
      <p className="mt-4 max-w-prose text-base leading-relaxed text-(--color-muted)">
        Coba muat ulang halaman ini. Kalau masih bermasalah, kembali ke beranda
        dan ulangi langkah dari sana. Datamu aman, tidak ada yang hilang.
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
          href="/"
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
    </main>
  );
}

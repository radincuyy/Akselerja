import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-svh flex-col items-center justify-center bg-(--color-paper) px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
        404
      </p>
      <h1 className="mt-4 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)">
        Halaman ini belum ada, atau sudah pindah.
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-(--color-muted)">
        Mungkin link yang kamu klik salah ketik, atau halamannya memang belum
        kami bangun. Tidak masalah, semua yang kamu butuhkan ada di beranda.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep)"
        >
          Kembali ke beranda
        </Link>
        <Link
          href="/daftar/kandidat"
          className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-5 py-2.5 text-sm font-medium text-(--color-ink) transition-colors hover:border-(--color-ink)"
        >
          Daftar gratis
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import Logo from "@/components/Logo";

export default function DaftarPage() {
  return (
    <main className="min-h-svh bg-(--color-paper)">
      <header className="border-b border-(--color-line)">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-5 sm:px-8">
          <Link href="/" aria-label="Akselerja" className="text-(--color-ink)">
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
          Pilih jalurmu
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)">
          Daftar Akselerja
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted)">
          Pilih cara kamu menggunakan Akselerja. Kamu bisa daftar di salah satu
          dulu, lalu menambahkan satunya nanti dari pengaturan akun.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link
            href="/daftar/kandidat"
            className="group flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-6 transition-colors hover:border-(--color-teal)"
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-teal)">
              Untuk pencari kerja
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-(--color-ink)">
              Saya cari kerja
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
              Buat profil, lihat lowongan dengan match score, dan dapatkan
              rekomendasi pelatihan.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-(--color-ink) group-hover:text-(--color-teal)">
              Lanjutkan
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h8M8 4l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
          <Link
            href="/daftar/perusahaan"
            className="group flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-6 transition-colors hover:border-(--color-teal)"
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
              Untuk perusahaan
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-(--color-ink)">
              Saya rekrut kandidat
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
              Pasang lowongan, lihat kandidat berdasarkan keterampilan aktual,
              dan kelola proses rekrutmen.
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-(--color-ink) group-hover:text-(--color-teal)">
              Lanjutkan
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h8M8 4l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </div>

        <p className="mt-10 text-sm text-(--color-muted)">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-medium text-(--color-teal) hover:text-(--color-teal-deep)">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}

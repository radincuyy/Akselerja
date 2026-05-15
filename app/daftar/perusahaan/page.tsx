import Link from "next/link";
import Logo from "@/components/Logo";
import PerusahaanSignupForm from "@/components/PerusahaanSignupForm";

export default function DaftarPerusahaanPage() {
  return (
    <main className="min-h-svh bg-(--color-paper)">
      <header className="border-b border-(--color-line)">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Akselerja" className="text-(--color-ink)">
            <Logo className="h-6 w-auto" />
          </Link>
          <Link
            href="/masuk"
            className="text-sm text-(--color-muted) hover:text-(--color-ink)"
          >
            Sudah punya akun?
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
          Untuk perusahaan
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)">
          Daftar perusahaan
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted)">
          Akun perusahaan bisa dipakai oleh banyak recruiter di tim kamu. Mulai
          dengan satu admin, tambahkan anggota tim setelah masuk.
        </p>

        <div className="mt-10 max-w-md">
          <PerusahaanSignupForm />
        </div>
      </div>
    </main>
  );
}

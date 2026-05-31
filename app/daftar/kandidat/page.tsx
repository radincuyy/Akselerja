import Link from "next/link";
import Logo from "@/components/layout/Logo";
import KandidatSignupForm from "@/components/auth/KandidatSignupForm";

export default function DaftarKandidatPage() {
  return (
    <main id="main" className="min-h-svh bg-(--color-paper)">
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
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-teal)">
          Untuk pencari kerja
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)">
          Buat akun dalam 30 detik
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted)">
          Cuma butuh email dan password. Profil lengkap kita kerjakan
          bersama-sama setelah ini.
        </p>

        <div className="mt-10 max-w-md">
          <KandidatSignupForm />
        </div>

        <p className="mt-8 text-xs leading-relaxed text-(--color-muted)">
          Dengan mendaftar, kamu setuju dengan{" "}
          <Link href="/syarat" className="underline hover:text-(--color-ink)">
            Syarat Layanan
          </Link>{" "}
          dan{" "}
          <Link href="/privasi" className="underline hover:text-(--color-ink)">
            Kebijakan Privasi
          </Link>{" "}
          Akselerja. Profilmu cuma terlihat oleh kamu sampai kamu siap.
        </p>
      </div>
    </main>
  );
}

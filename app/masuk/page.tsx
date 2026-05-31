import Link from "next/link";
import Logo from "@/components/layout/Logo";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import CredentialsLoginForm from "@/components/auth/CredentialsLoginForm";

type SearchParams = Promise<{ reset?: string; error?: string; next?: string }>;

export default async function MasukPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { reset, error, next } = await searchParams;
  const callbackUrl = next && next.startsWith("/") ? next : "/app";
  return (
    <main id="main" className="min-h-svh bg-(--color-paper)">
      <header className="border-b border-(--color-line)">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-5 sm:px-8">
          <Link href="/" aria-label="Akselerja" className="text-(--color-ink)">
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-md px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
          Masuk ke Akselerja
        </h1>
        <p className="mt-3 text-base leading-relaxed text-(--color-muted)">
          Pakai akun email yang sudah terdaftar, atau lanjut dengan Google.
        </p>

        {reset === "1" ? (
          <div
            role="status"
            className="mt-6 rounded-lg border border-(--color-line) bg-(--color-tint) p-4"
          >
            <p className="text-sm font-semibold text-(--color-ink)">
              Password berhasil diatur ulang
            </p>
            <p className="mt-1 text-sm text-(--color-muted)">
              Masuk dengan password baru kamu.
            </p>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-(--color-signal-clay) bg-(--color-tint) p-4"
          >
            <p className="text-sm font-semibold text-(--color-ink)">
              Gagal masuk
            </p>
            <p className="mt-1 text-sm text-(--color-muted)">
              Terjadi kesalahan saat proses masuk. Coba lagi atau pakai akun lain.
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <CredentialsLoginForm callbackUrl={callbackUrl} />
          <p className="mt-3 text-right text-xs text-(--color-muted)">
            <Link href="/lupa-password" className="hover:text-(--color-ink)">
              Lupa password?
            </Link>
          </p>
        </div>

        <div className="my-8 flex items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-(--color-line)" />
          <span className="text-xs uppercase tracking-wider text-(--color-muted)">
            atau
          </span>
          <span aria-hidden className="h-px flex-1 bg-(--color-line)" />
        </div>

        <GoogleSignInButton />

        <p className="mt-6 text-sm text-(--color-muted)">
          Belum punya akun?{" "}
          <Link
            href="/daftar"
            className="font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
          >
            Daftar gratis
          </Link>
        </p>
      </div>
    </main>
  );
}

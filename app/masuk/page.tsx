import Link from "next/link";
import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";

type SearchParams = Promise<{ reset?: string }>;

export default async function MasukPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { reset } = await searchParams;
  return (
    <main className="min-h-svh bg-(--color-paper)">
      <header className="border-b border-(--color-line)">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-5 sm:px-8">
          <Link href="/" aria-label="Akselerja" className="text-(--color-ink)">
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-md px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-semibold tracking-tight text-(--color-ink)">
          Masuk ke Akselerja
        </h1>
        <p className="mt-3 text-base leading-relaxed text-(--color-muted)">
          Pakai email yang kamu daftarkan. Kami akan arahkan ke beranda yang
          tepat berdasarkan tipe akunmu.
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

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-8 text-sm text-(--color-muted)">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-medium text-(--color-teal) hover:text-(--color-teal-deep)">
            Daftar gratis
          </Link>
        </p>
      </div>
    </main>
  );
}

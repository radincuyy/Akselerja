import Link from "next/link";
import Logo from "@/components/Logo";
import OnboardingFlow from "@/components/OnboardingFlow";
import { requireUser } from "@/lib/session";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <main id="main" className="min-h-svh bg-(--color-paper)">
      <header className="border-b border-(--color-line)">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Akselerja" className="text-(--color-ink)">
            <Logo className="h-6 w-auto" />
          </Link>
          <Link
            href="/app"
            className="text-sm text-(--color-muted) hover:text-(--color-ink)"
          >
            Lewati untuk sekarang
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <OnboardingFlow />
      </div>
    </main>
  );
}

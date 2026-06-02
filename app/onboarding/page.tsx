import Logo from "@/components/layout/Logo";
import OnboardingFlow from "@/components/profile/OnboardingFlow";
import { requireUser } from "@/lib/auth/session";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <main id="main" className="min-h-svh bg-(--color-paper)">
      <header className="border-b border-(--color-line)">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 sm:px-8">
          <span className="text-(--color-ink)">
            <Logo className="h-6 w-auto" />
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <OnboardingFlow />
      </div>
    </main>
  );
}

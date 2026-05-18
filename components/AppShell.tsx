import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import Logo from "./Logo";
import MobileNav from "./MobileNav";
import SignOutButton from "./SignOutButton";
import { getProfileOrSeedAsync } from "@/lib/profile-store";
import { getCurrentUser } from "@/lib/session";

type NavItem = { href: string; label: string };

type Props = {
  active?: string;
  children: React.ReactNode;
};

const candidateNav: NavItem[] = [
  { href: "/app", label: "Beranda" },
  { href: "/app/lowongan", label: "Lowongan" },
  { href: "/app/profil", label: "Profil" },
  { href: "/app/assessment", label: "Assessment" },
  { href: "/app/belajar", label: "Belajar" },
  { href: "/app/coach", label: "Coach" },
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function AppShell({ active, children }: Props) {
  noStore();
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id ?? "me";

  const profile = await getProfileOrSeedAsync(userId);
  const profileName = currentUser?.name ?? profile.name;
  const yearsLabel =
    profile.experienceYears === 0
      ? "Belum berpengalaman"
      : `${profile.experienceYears} thn`;
  const cityLabel = profile.location.split(",")[0] || "Indonesia";
  const profileMeta = `${cityLabel} · ${yearsLabel}`;
  const initials = initialsFromName(profileName);

  return (
    <div className="min-h-svh bg-(--color-paper)">
      <header className="sticky top-0 z-30 border-b border-(--color-line) bg-(--color-paper)">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link href="/app" aria-label="Akselerja" className="text-(--color-ink)">
              <Logo className="h-6 w-auto" />
            </Link>
            <nav aria-label="Menu utama" className="hidden items-center gap-1 md:flex">
              {candidateNav.map((item) => {
                const isActive = active === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-(--color-teal)"
                        : "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-(--color-muted) transition-colors hover:text-(--color-ink)"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-(--color-ink) leading-tight">
                {profileName}
              </p>
              <p className="text-xs text-(--color-muted) leading-tight">{profileMeta}</p>
            </div>
            <div
              aria-hidden
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-(--color-teal-deep) text-sm font-semibold text-(--color-paper-on-teal) sm:flex"
            >
              {initials}
            </div>
            <Link
              href="/app/pengaturan"
              aria-label="Pengaturan akun"
              title="Pengaturan"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-(--color-line) text-(--color-muted) transition-colors hover:border-(--color-ink) hover:text-(--color-ink)"
            >
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
            <SignOutButton />
          </div>
        </div>
        <MobileNav items={candidateNav} active={active} />
      </header>

      <main id="main" className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}

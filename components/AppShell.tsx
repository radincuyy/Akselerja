import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import Logo from "./Logo";
import MobileNav from "./MobileNav";
import {
  isUpdatedSinceSeen,
  listApplicationsForCandidate,
} from "@/lib/applications-store";
import { getProfile } from "@/lib/profile-store";

type NavItem = { href: string; label: string };

type Props = {
  variant: "candidate" | "company";
  active?: string;
  children: React.ReactNode;
};

const candidateNav: NavItem[] = [
  { href: "/app", label: "Beranda" },
  { href: "/app/lowongan", label: "Lowongan" },
  { href: "/app/lamaran", label: "Lamaran" },
  { href: "/app/profil", label: "Profil" },
  { href: "/app/assessment", label: "Assessment" },
  { href: "/app/belajar", label: "Belajar" },
  { href: "/app/coach", label: "Coach" },
];

const companyNav: NavItem[] = [
  { href: "/hr", label: "Beranda" },
  { href: "/hr/lowongan", label: "Lowongan" },
  { href: "/hr/insight", label: "Insight" },
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AppShell({ variant, active, children }: Props) {
  noStore();
  const items = variant === "candidate" ? candidateNav : companyNav;

  let profileName: string;
  let profileMeta: string;
  let initials: string;
  if (variant === "candidate") {
    const profile = getProfile();
    profileName = profile.name;
    const yearsLabel =
      profile.experienceYears === 0
        ? "Belum berpengalaman"
        : `${profile.experienceYears} thn`;
    profileMeta = `${profile.location.split(",")[0]} · ${yearsLabel}`;
    initials = initialsFromName(profile.name);
  } else {
    profileName = "PT Cipta Logistik";
    profileMeta = "HR Recruiter";
    initials = "CL";
  }

  const lamaranNewCount =
    variant === "candidate"
      ? listApplicationsForCandidate("me").filter((a) => isUpdatedSinceSeen(a)).length
      : 0;

  return (
    <div className="min-h-svh bg-(--color-paper)">
      <header className="sticky top-0 z-30 border-b border-(--color-line) bg-(--color-paper)">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link
              href={variant === "candidate" ? "/app" : "/hr"}
              aria-label="Akselerja"
              className="text-(--color-ink)"
            >
              <Logo className="h-6 w-auto" />
            </Link>
            <nav
              aria-label="Menu utama"
              className="hidden items-center gap-1 md:flex"
            >
              {items.map((item) => {
                const isActive = active === item.href;
                const showBadge = item.href === "/app/lamaran" && lamaranNewCount > 0;
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
                    {showBadge ? (
                      <span
                        aria-label={`${lamaranNewCount} update baru`}
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-teal) px-1.5 text-xs font-semibold leading-none text-(--color-paper-on-teal)"
                      >
                        {lamaranNewCount}
                      </span>
                    ) : null}
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
              <p className="text-xs text-(--color-muted) leading-tight">
                {profileMeta}
              </p>
            </div>
            <div
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-teal-deep) text-sm font-semibold text-(--color-paper-on-teal)"
            >
              {initials}
            </div>
            <Link
              href={variant === "candidate" ? "/app/pengaturan" : "/hr/pengaturan"}
              aria-label="Pengaturan akun"
              title="Pengaturan"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-(--color-line) text-(--color-muted) transition-colors hover:border-(--color-ink) hover:text-(--color-ink)"
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
            <Link
              href="/"
              aria-label="Keluar dari akun"
              title="Keluar"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--color-line) px-2.5 text-sm text-(--color-muted) transition-colors hover:border-(--color-ink) hover:text-(--color-ink) sm:px-3"
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </Link>
          </div>
        </div>
        <MobileNav items={items} active={active} lamaranNewCount={lamaranNewCount} />
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}

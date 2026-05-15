import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import Logo from "./Logo";
import {
  isUpdatedSinceSeen,
  listApplicationsForCandidate,
} from "@/lib/applications-store";

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

export default function AppShell({ variant, active, children }: Props) {
  noStore();
  const items = variant === "candidate" ? candidateNav : companyNav;
  const profileName = variant === "candidate" ? "Rahmat Saputra" : "PT Cipta Logistik";
  const profileMeta = variant === "candidate" ? "Bekasi · 1 thn" : "HR Recruiter";

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
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-teal) px-1 text-[10px] font-semibold leading-none text-(--color-paper-on-teal)"
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
              {variant === "candidate" ? "RS" : "CL"}
            </div>
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
        <nav
          aria-label="Menu utama mobile"
          className="border-t border-(--color-line) px-5 py-2 md:hidden"
        >
          <ul className="-mx-1 flex gap-1 overflow-x-auto">
            {items.map((item) => {
              const isActive = active === item.href;
              const showBadge = item.href === "/app/lamaran" && lamaranNewCount > 0;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "inline-flex items-center gap-1.5 rounded-md bg-(--color-tint) px-3 py-1.5 text-sm font-medium text-(--color-teal)"
                        : "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-(--color-muted)"
                    }
                  >
                    {item.label}
                    {showBadge ? (
                      <span
                        aria-label={`${lamaranNewCount} update baru`}
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-teal) px-1 text-[10px] font-semibold leading-none text-(--color-paper-on-teal)"
                      >
                        {lamaranNewCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}

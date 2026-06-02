"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { resetJuriProfileOnSignOut } from "@/lib/profile/profile-actions";
import Logo from "./Logo";
import type { CurrentUser } from "@/lib/auth/session";
import type { Candidate } from "@/lib/shared/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type Props = {
  currentUser: CurrentUser;
  profile: Candidate;
  children: React.ReactNode;
};

const candidateNav: NavItem[] = [
  {
    href: "/app",
    label: "Beranda",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 22V12h6v10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/app/lowongan",
    label: "Lowongan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 2H9a2 2 0 0 0-2 2v2h10V4a2 2 0 0 0-2-2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          width="20"
          height="14"
          x="2"
          y="6"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M12 11h.01M3 16h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/app/profil",
    label: "Profil",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/app/belajar",
    label: "Belajar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3ZM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/app/coach",
    label: "Coach",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 8h.01M10 8h.01M10 12h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m16 17 5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AppShell({ currentUser, profile, children }: Props) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const desktopProfileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileName = currentUser.name || profile.name;
  const yearsLabel =
    profile.experienceYears === 0
      ? "Belum berpengalaman"
      : `${profile.experienceYears} thn`;
  const cityLabel = profile.location.split(",")[0] || "Indonesia";
  const profileMeta = `${cityLabel} · ${yearsLabel}`;
  const initials = initialsFromName(profileName);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (desktopProfileMenuRef.current?.contains(target)) return;
      if (mobileProfileMenuRef.current?.contains(target)) return;
      setIsProfileMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await resetJuriProfileOnSignOut();
    } catch (err) {
      console.error("Failed to reset judge profile on sign out:", err);
    }
    signOut({ callbackUrl: "/" });
  }

  const navList = (
    <nav aria-label="Menu utama" className="flex flex-col gap-1">
      {candidateNav.map((item) => {
        const isActive = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "flex items-center gap-3 rounded-md bg-(--color-tint) px-3 py-2.5 text-sm font-medium text-(--color-teal)"
                : "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-(--color-muted) transition-colors hover:bg-(--color-tint) hover:text-(--color-ink)"
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const profileMenu = (
    <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-md border border-(--color-line) bg-(--color-paper) p-2 shadow-xl">
      <div className="border-b border-(--color-line) px-3 py-2">
        <p className="truncate text-sm font-medium leading-tight text-(--color-ink)">
          {profileName}
        </p>
        <p className="truncate text-xs leading-tight text-(--color-muted)">
          {profileMeta}
        </p>
      </div>
      <div className="pt-2">
        <Link
          href="/app/pengaturan"
          className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-(--color-muted) transition-colors hover:bg-(--color-tint) hover:text-(--color-ink)"
        >
          <GearIcon />
          <span>Pengaturan</span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-(--color-muted) transition-colors hover:bg-(--color-tint) hover:text-(--color-ink) disabled:opacity-60"
        >
          <LogoutIcon />
          <span>{isSigningOut ? "Keluar..." : "Keluar"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh w-full overflow-x-clip bg-(--color-paper) md:flex">
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 flex-col border-r border-(--color-line) bg-(--color-paper) p-5 md:flex">
        <div className="mb-4 flex items-center border-b border-(--color-line) pb-5">
          <Link
            href="/app"
            aria-label="Akselerja"
            className="text-(--color-ink)"
          >
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
        {navList}
      </aside>

      <div className="min-w-0 flex-1 overflow-x-clip">
        <header className="sticky top-0 z-20 hidden border-b border-(--color-line) bg-(--color-paper) md:block">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-8">
            <div className="flex items-center justify-end gap-4">
              <div ref={desktopProfileMenuRef} className="relative">
                <button
                  type="button"
                  aria-label="Buka menu profil"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => {
                    setIsProfileMenuOpen((open) => !open);
                  }}
                  className="inline-flex h-11 items-center gap-3 rounded-md px-2.5 text-left transition-colors hover:bg-(--color-tint)"
                >
                  <span className="hidden min-w-0 lg:block">
                    <span className="block max-w-40 truncate text-sm font-medium leading-tight text-(--color-ink)">
                      {profileName}
                    </span>
                    <span className="block max-w-40 truncate text-xs leading-tight text-(--color-muted)">
                      {profileMeta}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-teal-deep) text-xs font-semibold text-(--color-paper-on-teal)"
                  >
                    {initials}
                  </span>
                </button>
                {isProfileMenuOpen ? profileMenu : null}
              </div>
            </div>
          </div>
        </header>

        <header className="sticky top-0 z-30 border-b border-(--color-line) bg-(--color-paper) md:hidden">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Buka menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-(--color-line) text-(--color-ink) transition-colors hover:bg-(--color-tint)"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div ref={mobileProfileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen((open) => !open);
                  }}
                  aria-label="Buka menu profil"
                  aria-expanded={isProfileMenuOpen}
                  title="Profil"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-(--color-line) text-(--color-muted) transition-colors hover:border-(--color-ink) hover:text-(--color-ink)"
                >
                  <ProfileIcon />
                </button>
                {isProfileMenuOpen ? profileMenu : null}
              </div>
            </div>
          </div>
        </header>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button
              type="button"
              aria-label="Tutup menu"
              className="fixed inset-0 bg-black/10"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative flex h-full w-72 max-w-xs flex-col border-r border-(--color-line) bg-(--color-paper) p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-(--color-line) pb-5">
                <p className="text-sm font-semibold text-(--color-ink)">Menu</p>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Tutup menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-(--color-muted) transition-colors hover:bg-(--color-tint) hover:text-(--color-ink)"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M18 6 6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {navList}
            </div>
          </div>
        ) : null}

        <main
          id="main"
          className="mx-auto w-full min-w-0 max-w-7xl px-4 py-10 sm:px-8 sm:py-12"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

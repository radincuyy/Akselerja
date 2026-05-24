"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Logo from "./Logo";
import { buildNotifications, type AppNotification } from "@/lib/notifications";
import type { CurrentUser } from "@/lib/session";
import type { Candidate } from "@/lib/types";

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
    href: "/app/assessment",
    label: "Assessment",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M21.42 10.92a1 1 0 0 0-.02-1.84l-8.57-3.9a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0l8.59-3.9Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 18.8v-4L2.6 13M18 13.7v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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

const LOCAL_NOTIFICATION_LIMIT = 12;

function isAppNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AppNotification>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.body === "string" &&
    typeof item.time === "string"
  );
}

function mergeNotifications(
  localNotifications: AppNotification[],
  serverNotifications: AppNotification[],
): AppNotification[] {
  const seen = new Set<string>();
  return [...localNotifications, ...serverNotifications].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
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

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.27 21a2 2 0 0 0 3.46 0M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [serverNotifications, setServerNotifications] = useState<
    AppNotification[]
  >(() =>
    buildNotifications({
      hasCv: Boolean(profile.cv),
      skillCount: profile.skills?.length ?? 0,
      readinessScore: profile.readinessScore,
    }),
  );
  const [localNotifications, setLocalNotifications] = useState<
    AppNotification[]
  >([]);
  const [notificationsLive, setNotificationsLive] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [notificationStorageLoaded, setNotificationStorageLoaded] =
    useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const desktopProfileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopNotificationRef = useRef<HTMLDivElement | null>(null);
  const mobileNotificationRef = useRef<HTMLDivElement | null>(null);
  const profileName = currentUser.name || profile.name;
  const yearsLabel =
    profile.experienceYears === 0
      ? "Belum berpengalaman"
      : `${profile.experienceYears} thn`;
  const cityLabel = profile.location.split(",")[0] || "Indonesia";
  const profileMeta = `${cityLabel} · ${yearsLabel}`;
  const initials = initialsFromName(profileName);
  const readNotificationStorageKey = `akselerja:${currentUser.id}:notification-read`;
  const localNotificationStorageKey = `akselerja:${currentUser.id}:notification-local`;
  const readinessScoreStorageKey = `akselerja:${currentUser.id}:readiness-score`;
  const notifications = mergeNotifications(
    localNotifications,
    serverNotifications,
  );
  const unreadCount = notifications.filter(
    (item) => item.unread && !readNotificationIds.has(item.id),
  ).length;

  function addLocalNotification(notification: AppNotification) {
    setLocalNotifications((current) => {
      const next = [
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ];
      return next.slice(0, LOCAL_NOTIFICATION_LIMIT);
    });
    setReadNotificationIds((current) => {
      const next = new Set(current);
      next.delete(notification.id);
      return next;
    });
  }

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileMenuOpen(false);
    setIsNotificationOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const savedReadIds = JSON.parse(
        window.localStorage.getItem(readNotificationStorageKey) ?? "[]",
      );
      if (Array.isArray(savedReadIds)) {
        setReadNotificationIds(
          new Set(savedReadIds.filter((id) => typeof id === "string")),
        );
      }

      const savedLocalNotifications = JSON.parse(
        window.localStorage.getItem(localNotificationStorageKey) ?? "[]",
      );
      if (Array.isArray(savedLocalNotifications)) {
        setLocalNotifications(
          savedLocalNotifications
            .filter(isAppNotification)
            .slice(0, LOCAL_NOTIFICATION_LIMIT),
        );
      }
    } catch {
    } finally {
      setNotificationStorageLoaded(true);
    }
  }, [localNotificationStorageKey, readNotificationStorageKey]);

  useEffect(() => {
    if (!notificationStorageLoaded) return;
    window.localStorage.setItem(
      readNotificationStorageKey,
      JSON.stringify([...readNotificationIds]),
    );
  }, [
    notificationStorageLoaded,
    readNotificationIds,
    readNotificationStorageKey,
  ]);

  useEffect(() => {
    if (!notificationStorageLoaded) return;
    window.localStorage.setItem(
      localNotificationStorageKey,
      JSON.stringify(localNotifications),
    );
  }, [
    localNotificationStorageKey,
    localNotifications,
    notificationStorageLoaded,
  ]);

  useEffect(() => {
    function handleNotificationCreated(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!isAppNotification(detail)) return;

      addLocalNotification(detail);
    }

    window.addEventListener(
      "akselerja:notification-created",
      handleNotificationCreated,
    );
    return () => {
      window.removeEventListener(
        "akselerja:notification-created",
        handleNotificationCreated,
      );
    };
  }, []);

  useEffect(() => {
    if (!notificationStorageLoaded) return;

    const currentScore = profile.readinessScore ?? 0;
    const savedScore = window.localStorage.getItem(readinessScoreStorageKey);
    const previousScore =
      savedScore === null ? currentScore : Number(savedScore);

    if (
      savedScore !== null &&
      Number.isFinite(previousScore) &&
      currentScore > previousScore
    ) {
      addLocalNotification({
        id: `readiness-score-${currentScore}-${Date.now()}`,
        title: "Skor kesiapan naik",
        body: `Skor kesiapan kerja kamu naik ${currentScore - previousScore} poin menjadi ${currentScore}.`,
        time: "Baru saja",
        unread: true,
      });
    }

    window.localStorage.setItem(
      readinessScoreStorageKey,
      String(currentScore),
    );
  }, [
    notificationStorageLoaded,
    profile.readinessScore,
    readinessScoreStorageKey,
  ]);

  useEffect(() => {
    function handleReadinessScoreIncreased(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") return;

      const payload = detail as {
        newScore?: unknown;
        increasedBy?: unknown;
      };
      if (
        typeof payload.newScore !== "number" ||
        typeof payload.increasedBy !== "number" ||
        payload.increasedBy <= 0
      ) {
        return;
      }

      addLocalNotification({
        id: `readiness-score-${payload.newScore}-${Date.now()}`,
        title: "Skor kesiapan naik",
        body: `Skor kesiapan kerja kamu naik ${payload.increasedBy} poin menjadi ${payload.newScore}.`,
        time: "Baru saja",
        unread: true,
      });
      window.localStorage.setItem(
        readinessScoreStorageKey,
        String(payload.newScore),
      );
    }

    window.addEventListener(
      "akselerja:readiness-score-increased",
      handleReadinessScoreIncreased,
    );
    return () => {
      window.removeEventListener(
        "akselerja:readiness-score-increased",
        handleReadinessScoreIncreased,
      );
    };
  }, [readinessScoreStorageKey]);

  useEffect(() => {
    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;

    function applyPayload(payload: unknown) {
      if (
        payload &&
        typeof payload === "object" &&
        "notifications" in payload &&
        Array.isArray((payload as { notifications: unknown }).notifications)
      ) {
        setServerNotifications(
          (payload as { notifications: AppNotification[] }).notifications,
        );
      }
    }

    async function fetchLatest() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        applyPayload(await res.json());
      } catch {
      }
    }

    window.addEventListener("akselerja:notifications-refresh", fetchLatest);

    if (typeof window !== "undefined" && "EventSource" in window) {
      const source = new EventSource("/api/notifications/stream");
      source.addEventListener("open", () => {
        if (!cancelled) setNotificationsLive(true);
      });
      source.addEventListener("notifications", (event) => {
        if (cancelled) return;
        try {
          applyPayload(JSON.parse((event as MessageEvent).data));
        } catch {
        }
      });
      source.addEventListener("error", () => {
        if (cancelled) return;
        setNotificationsLive(false);
        source.close();
        fetchLatest();
        pollId = setInterval(fetchLatest, 20_000);
      });
      return () => {
        cancelled = true;
        window.removeEventListener(
          "akselerja:notifications-refresh",
          fetchLatest,
        );
        source.close();
        if (pollId) clearInterval(pollId);
      };
    }

    fetchLatest();
    pollId = setInterval(fetchLatest, 20_000);
    return () => {
      cancelled = true;
      window.removeEventListener(
        "akselerja:notifications-refresh",
        fetchLatest,
      );
      if (pollId) clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen && !isNotificationOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (desktopProfileMenuRef.current?.contains(target)) return;
      if (mobileProfileMenuRef.current?.contains(target)) return;
      if (desktopNotificationRef.current?.contains(target)) return;
      if (mobileNotificationRef.current?.contains(target)) return;
      setIsProfileMenuOpen(false);
      setIsNotificationOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen, isNotificationOpen]);

  function handleSignOut() {
    setIsSigningOut(true);
    signOut({ callbackUrl: "/" });
  }

  function markAllNotificationsRead() {
    setReadNotificationIds(new Set(notifications.map((item) => item.id)));
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

  const notificationMenu = (
    <div className="absolute right-0 top-full z-40 mt-2 w-[calc(100vw-2.5rem)] overflow-hidden rounded-md border border-(--color-line) bg-(--color-paper) shadow-xl sm:w-96 md:w-80">
      <div className="flex items-center justify-between gap-3 border-b border-(--color-line) px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-(--color-ink)">Notifikasi</p>
          <p className="text-xs text-(--color-muted)">
            {unreadCount > 0
              ? `${unreadCount} belum dibaca`
              : "Semua sudah dibaca"}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-(--color-muted)">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                notificationsLive
                  ? "bg-(--color-signal-green)"
                  : "bg-(--color-signal-amber)"
              }`}
            />
            {notificationsLive ? "Realtime aktif" : "Memperbarui berkala"}
          </p>
        </div>
        <button
          type="button"
          onClick={markAllNotificationsRead}
          className="rounded-md px-2 py-1 text-xs font-medium text-(--color-teal) transition-colors hover:bg-(--color-tint)"
        >
          Tandai dibaca
        </button>
      </div>
      <div className="pretty-scrollbar max-h-80 overflow-y-auto p-2 pr-1">
        {notifications.map((item) => {
          const unread = Boolean(
            item.unread && !readNotificationIds.has(item.id),
          );
          return (
            <div
              key={item.id}
              className="rounded-md px-3 py-3 transition-colors hover:bg-(--color-tint)"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    unread ? "bg-(--color-teal)" : "bg-(--color-line)"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug text-(--color-ink)">
                      {item.title}
                    </p>
                    <span className="shrink-0 text-xs text-(--color-muted)">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-(--color-muted)">
                    {item.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
    <div className="min-h-svh bg-(--color-paper) md:flex">
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

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 hidden border-b border-(--color-line) bg-(--color-paper) md:block">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-8">
            <div className="flex items-center justify-end gap-4">
              <div ref={desktopNotificationRef} className="relative">
                <button
                  type="button"
                  aria-label="Buka notifikasi"
                  aria-expanded={isNotificationOpen}
                  title="Notifikasi"
                  onClick={() => {
                    setIsNotificationOpen((open) => !open);
                    setIsProfileMenuOpen(false);
                  }}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-(--color-muted) transition-colors hover:bg-(--color-tint) hover:text-(--color-ink)"
                >
                  <BellIcon />
                  {unreadCount > 0 ? (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--color-teal)" />
                  ) : null}
                </button>
                {isNotificationOpen ? notificationMenu : null}
              </div>

              <div className="h-6 w-px rounded-md bg-(--color-line)" />

              <div ref={desktopProfileMenuRef} className="relative">
                <button
                  type="button"
                  aria-label="Buka menu profil"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => {
                    setIsProfileMenuOpen((open) => !open);
                    setIsNotificationOpen(false);
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
              <div ref={mobileNotificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationOpen((open) => !open);
                    setIsProfileMenuOpen(false);
                  }}
                  aria-label="Buka notifikasi"
                  aria-expanded={isNotificationOpen}
                  title="Notifikasi"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-(--color-line) text-(--color-muted) transition-colors hover:border-(--color-ink) hover:text-(--color-ink)"
                >
                  <BellIcon />
                  {unreadCount > 0 ? (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--color-teal)" />
                  ) : null}
                </button>
                {isNotificationOpen ? notificationMenu : null}
              </div>

              <div ref={mobileProfileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen((open) => !open);
                    setIsNotificationOpen(false);
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
          className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

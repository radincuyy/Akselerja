"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setLoading(true);
        signOut({ callbackUrl: "/" });
      }}
      disabled={loading}
      aria-label="Keluar dari akun"
      title="Keluar"
      className="inline-flex h-11 items-center gap-1.5 rounded-md border border-(--color-line) px-3 text-sm text-(--color-muted) transition-colors hover:border-(--color-ink) hover:text-(--color-ink) disabled:opacity-60 sm:px-3.5"
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
      <span className="hidden sm:inline">{loading ? "Keluar..." : "Keluar"}</span>
    </button>
  );
}

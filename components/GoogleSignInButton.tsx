"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setLoading(true);
        signIn("google", { callbackUrl: "/app" });
      }}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-(--color-line) bg-(--color-paper) px-5 py-3 text-base font-semibold text-(--color-ink) transition-colors hover:border-(--color-ink) disabled:opacity-60"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
        <path
          fill="#4285F4"
          d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.351z"
        />
        <path
          fill="#34A853"
          d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20z"
        />
        <path
          fill="#FBBC05"
          d="M4.405 11.9a6.012 6.012 0 0 1 0-3.8V5.51H1.064a9.996 9.996 0 0 0 0 8.98l3.34-2.59z"
        />
        <path
          fill="#EA4335"
          d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.96.99 12.696 0 10 0A9.996 9.996 0 0 0 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z"
        />
      </svg>
      <span>{loading ? "Menyiapkan..." : "Masuk dengan Google"}</span>
    </button>
  );
}

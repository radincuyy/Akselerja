"use client";

import { useLinkStatus } from "next/link";

export default function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
    />
  );
}

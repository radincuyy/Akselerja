"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ProfileEditUI from "./ProfileEditUI";

const LazyProfileEditUI = dynamic(() => import("./ProfileEditUI"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      className="mt-8 rounded-lg border border-(--color-line) bg-(--color-paper) p-8 text-sm text-(--color-muted)"
    >
      Memuat editor profil...
    </div>
  ),
});

export default function ProfileEditMount(
  props: ComponentProps<typeof ProfileEditUI>,
) {
  return <LazyProfileEditUI {...props} />;
}

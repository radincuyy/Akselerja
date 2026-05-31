"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ProfileEditUI from "./ProfileEditUI";

function ProfileEditSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat editor profil"
      className="mt-8 flex flex-col gap-4 motion-safe:animate-pulse"
    >
      <div className="h-32 rounded-lg border border-(--color-line) bg-(--color-tint)" />
      <div className="h-44 rounded-lg border border-(--color-line) bg-(--color-tint)" />
      <div className="h-44 rounded-lg border border-(--color-line) bg-(--color-tint)" />
      <div className="h-44 rounded-lg border border-(--color-line) bg-(--color-tint)" />
      <span className="sr-only">Memuat editor profil...</span>
    </div>
  );
}

const LazyProfileEditUI = dynamic(() => import("./ProfileEditUI"), {
  ssr: false,
  loading: () => <ProfileEditSkeleton />,
});

export default function ProfileEditMount(
  props: ComponentProps<typeof ProfileEditUI>,
) {
  return <LazyProfileEditUI {...props} />;
}

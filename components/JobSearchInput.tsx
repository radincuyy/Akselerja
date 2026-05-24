"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";

type Props = {
  defaultValue?: string;
  fallbackSearchParams?: Record<string, string>;
};

export default function JobSearchInput({
  defaultValue = "",
  fallbackSearchParams,
}: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const inputId = useId();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams(search.toString());
    if (fallbackSearchParams && params.size === 0) {
      for (const [key, paramValue] of Object.entries(fallbackSearchParams)) {
        if (paramValue) params.set(key, paramValue);
      }
    }
    const trimmed = value.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/app/lowongan?${qs}` : "/app/lowongan");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor={inputId} className="sr-only">
        Cari lowongan
      </label>
      <div className="relative flex-1">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-(--color-muted)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id={inputId}
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cari posisi, perusahaan, atau kata kunci di deskripsi"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) py-2.5 pl-9 pr-3 text-sm text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-4 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
      >
        Cari
      </button>
    </form>
  );
}

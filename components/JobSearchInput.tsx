"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";

type Props = {
  defaultValue?: string;
};

export default function JobSearchInput({ defaultValue = "" }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function navigate(nextValue: string) {
    const params = new URLSearchParams(search.toString());
    const trimmed = nextValue.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/app/lowongan?${qs}` : "/app/lowongan");
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate(value);
  }

  function clear() {
    setValue("");
    navigate("");
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
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
            <path
              d="M11 11l3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          id={inputId}
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && value) {
              e.preventDefault();
              clear();
            }
          }}
          placeholder="Cari posisi atau perusahaan"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) py-2.5 pl-9 pr-9 text-sm text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Hapus pencarian"
            className="absolute inset-y-0 right-2 flex items-center justify-center px-1 text-(--color-muted) hover:text-(--color-ink)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-4 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-60"
      >
        {isPending ? "Mencari..." : "Cari"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  initial: string;
};

export default function CandidateSearchInput({ initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value === initial) return;
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="search-cand" className="sr-only">
        Cari nama kandidat
      </label>
      <div className="relative w-full sm:w-60">
        <input
          id="search-cand"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cari nama kandidat…"
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2.5 text-sm text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
        {isPending ? (
          <span
            aria-hidden
            className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-(--color-line) border-t-(--color-teal)"
          />
        ) : null}
      </div>
    </div>
  );
}

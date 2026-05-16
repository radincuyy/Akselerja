"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type Item = { href: string; label: string };

type Props = {
  items: Item[];
  active?: string;
  lamaranNewCount: number;
};

export default function MobileNav({ items, active, lamaranNewCount }: Props) {
  const activeRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "instant",
    });
  }, [active]);

  return (
    <nav
      aria-label="Menu utama mobile"
      className="border-t border-(--color-line) px-5 py-2 md:hidden"
    >
      <ul
        className="-mx-1 flex gap-1 overflow-x-auto"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
        }}
      >
        {items.map((item) => {
          const isActive = active === item.href;
          const showBadge = item.href === "/app/lamaran" && lamaranNewCount > 0;
          return (
            <li
              key={item.href}
              className="shrink-0"
              ref={isActive ? activeRef : undefined}
            >
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "inline-flex min-h-11 items-center gap-1.5 rounded-md bg-(--color-tint) px-3.5 py-2 text-sm font-medium text-(--color-teal)"
                    : "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3.5 py-2 text-sm text-(--color-muted)"
                }
              >
                {item.label}
                {showBadge ? (
                  <span
                    aria-label={`${lamaranNewCount} update baru`}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-teal) px-1.5 text-xs font-semibold leading-none text-(--color-paper-on-teal)"
                  >
                    {lamaranNewCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

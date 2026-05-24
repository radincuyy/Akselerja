"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DesktopNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu utama" className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const isActive = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-(--color-teal)"
                : "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-(--color-muted) transition-colors hover:text-(--color-ink)"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

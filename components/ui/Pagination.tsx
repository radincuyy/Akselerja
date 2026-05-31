import Link from "next/link";
import type { ReactNode } from "react";

type PageValue = number | "gap";

export default function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
  label,
  className,
  compact,
}: {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  label: string;
  className?: string;
  compact?: boolean;
}) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label={`Pagination ${label}`}
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <p className="text-sm text-(--color-muted)">
        Halaman {currentPage} dari {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        <PageLink
          href={hrefForPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          compact={compact}
        >
          Sebelumnya
        </PageLink>
        {pages.map((page, index) =>
          page === "gap" ? (
            <span
              key={`gap-${index}`}
              className="inline-flex min-h-10 items-center px-1 text-sm text-(--color-muted)"
            >
              ...
            </span>
          ) : (
            <PageLink
              key={page}
              href={hrefForPage(page)}
              active={page === currentPage}
              compact={compact}
            >
              {page}
            </PageLink>
          ),
        )}
        <PageLink
          href={hrefForPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          compact={compact}
        >
          Berikutnya
        </PageLink>
      </div>
    </nav>
  );
}

function visiblePages(
  currentPage: number,
  totalPages: number,
): PageValue[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const result: PageValue[] = [];

  for (const page of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && page - previous > 1) {
      result.push("gap");
    }
    result.push(page);
  }

  return result;
}

function PageLink({
  href,
  children,
  active,
  disabled,
  compact,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const sizeClass = compact ? "min-h-9 px-2.5" : "min-h-10 px-3";

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-md border border-(--color-line) text-sm text-(--color-muted) opacity-50 ${sizeClass}`}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? `inline-flex items-center justify-center rounded-md border border-(--color-teal) bg-(--color-tint) text-sm font-semibold text-(--color-teal) ${sizeClass}`
          : `inline-flex items-center justify-center rounded-md border border-(--color-line) bg-(--color-paper) text-sm text-(--color-ink) transition-colors hover:border-(--color-teal) hover:text-(--color-teal) ${sizeClass}`
      }
    >
      {children}
    </Link>
  );
}

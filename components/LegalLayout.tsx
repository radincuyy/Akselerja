import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";

type Props = {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

const LEGAL_LINKS = [
  { href: "/syarat", label: "Syarat layanan" },
  { href: "/privasi", label: "Kebijakan privasi" },
  { href: "/kebijakan-data", label: "Kebijakan data" },
];

export default function LegalLayout({
  eyebrow,
  title,
  effectiveDate,
  children,
}: Props) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-sm font-medium text-(--color-muted)">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)">
          {title}
        </h1>
        <p className="mt-3 text-sm text-(--color-muted)">
          Berlaku sejak {effectiveDate}
        </p>

        <nav
          aria-label="Halaman hukum"
          className="mt-8 flex flex-wrap gap-2 border-y border-(--color-line) py-3"
        >
          {LEGAL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-(--color-line) bg-(--color-paper) px-3.5 py-1.5 text-xs font-medium text-(--color-muted) hover:border-(--color-ink)/40 hover:text-(--color-ink) aria-[current=page]:border-(--color-teal) aria-[current=page]:text-(--color-teal)"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <article className="prose-akselerja mt-10 space-y-6 text-base leading-relaxed text-(--color-ink) [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-(--color-ink) [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-(--color-ink) [&_p]:text-(--color-ink) [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-(--color-teal) [&_a]:underline hover:[&_a]:text-(--color-teal-deep)">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}

import Logo from "./Logo";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-(--color-line) bg-(--color-paper)">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href="/"
          aria-label="Akselerja, ke beranda"
          className="flex items-center gap-2 text-(--color-ink)"
        >
          <Logo className="h-6 w-auto" />
        </a>
        <nav className="flex items-center gap-2 sm:gap-5">
          <a
            href="#untuk-perusahaan"
            className="hidden text-sm text-(--color-muted) transition-colors hover:text-(--color-ink) sm:inline"
          >
            Saya perusahaan
          </a>
          <a
            href="/masuk"
            className="rounded-md border border-(--color-line) px-3.5 py-1.5 text-sm font-medium text-(--color-ink) transition-colors hover:border-(--color-ink)"
          >
            Masuk
          </a>
        </nav>
      </div>
    </header>
  );
}

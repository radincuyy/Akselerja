import Logo from "../layout/Logo";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/40 bg-(--color-paper)/75 backdrop-blur-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_32px_0_rgba(0,0,0,0.02)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href="/"
          aria-label="Akselerja, ke beranda"
          className="flex items-center gap-2 text-(--color-ink) transition-transform active:scale-[0.98]"
        >
          <Logo className="h-6 w-auto" />
        </a>
        <nav className="flex items-center gap-2 sm:gap-5">
          <a
            href="/masuk"
            className="tactile-press rounded-md border border-(--color-line) bg-white px-4 py-1.5 text-sm font-medium text-(--color-ink) transition-all hover:border-(--color-teal) hover:text-(--color-teal)"
          >
            Masuk
          </a>
        </nav>
      </div>
    </header>
  );
}

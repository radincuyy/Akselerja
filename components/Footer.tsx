import Logo from "./Logo";

const groups = [
  {
    title: "Kandidat",
    links: [
      { label: "Cara kerja", href: "#" },
      { label: "Skill assessment", href: "#" },
      { label: "Rencana belajar", href: "#" },
      { label: "Career coach", href: "#" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "HR dashboard", href: "#untuk-perusahaan" },
      { label: "Filter kandidat", href: "#untuk-perusahaan" },
      { label: "Hubungi tim", href: "mailto:halo@akselerja.id" },
    ],
  },
  {
    title: "Sumber",
    links: [
      { label: "Blog karier", href: "#" },
      { label: "Panduan profil", href: "#" },
      { label: "Status sistem", href: "#" },
    ],
  },
  {
    title: "Hukum",
    links: [
      { label: "Privasi", href: "#" },
      { label: "Syarat layanan", href: "#" },
      { label: "Kebijakan data", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-(--color-line) bg-(--color-tint)">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-12">
          <div>
            <Logo className="h-6 w-auto text-(--color-ink)" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-(--color-muted)">
              Platform AI job matching, skill assessment, dan upskilling untuk
              tenaga kerja Indonesia.
            </p>
            <p className="mt-6 text-xs text-(--color-muted)">
              Dibuat di Indonesia
            </p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                {group.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-(--color-ink) transition-colors hover:text-(--color-teal)"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-(--color-line) pt-6 text-xs text-(--color-muted) sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Akselerja. Semua hak dilindungi.</p>
          <p>
            <a
              href="mailto:halo@akselerja.id"
              className="transition-colors hover:text-(--color-ink)"
            >
              halo@akselerja.id
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

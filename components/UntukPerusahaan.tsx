import Reveal from "./Reveal";

export default function UntukPerusahaan() {
  return (
    <section
      id="untuk-perusahaan"
      aria-labelledby="company-heading"
      className="border-t border-(--color-line) bg-(--color-tint)"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
            Untuk perusahaan
          </p>
          <h2
            id="company-heading"
            className="mt-4 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-(--color-ink)"
          >
            Temukan kandidat yang siap kerja, dan yang berpotensi untuk dilatih.
          </h2>
        </Reveal>

        <Reveal>
          <p className="max-w-xl text-base leading-relaxed text-(--color-muted)">
            Akselerja menyaring kandidat berdasarkan keterampilan aktual,
            bukan hanya kata kunci CV. Kamu lihat skor kecocokan, alasannya,
            dan skill gap masing-masing kandidat sebelum mengundang interview.
            Kandidat yang belum 100% siap pun bisa kamu nilai berdasarkan
            potensi belajar.
          </p>
          <a
            href="/daftar/perusahaan"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-(--color-ink) px-4 py-2.5 text-sm font-medium text-(--color-ink) transition-colors hover:bg-(--color-ink) hover:text-(--color-paper)"
          >
            Daftar untuk perusahaan
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 7h8M8 4l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

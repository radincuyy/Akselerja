import Reveal from "./Reveal";

const steps = [
  {
    n: "01",
    title: "Bangun profil yang lebih kuat dari CV biasa",
    body: "Unggah CV atau isi profil cepat. AI mengekstrak skill, pengalaman, dan minatmu, lalu menyusun profil kompetensi yang menunjukkan apa yang sebenarnya kamu bisa.",
    miniLabel: "Profil kompetensi",
    miniContent: (
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {[
          "Microsoft Excel",
          "Komunikasi",
          "Inventory",
          "Customer service",
          "Pengalaman 1 tahun",
        ].map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-(--color-teal-deep) px-2.5 py-1 text-xs text-(--color-paper-on-teal)"
          >
            {tag}
          </li>
        ))}
      </ul>
    ),
  },
  {
    n: "02",
    title: "Lihat lowongan, dengan match score yang punya alasan",
    body: "Setiap lowongan punya angka kecocokan dan satu kalimat yang menjelaskannya. Kamu tahu skill mana yang sudah cocok, mana yang masih kurang.",
    miniLabel: "Hasil match",
    miniContent: (
      <div className="mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-3">
        <span className="text-3xl font-semibold text-(--color-paper-on-teal)">
          82%
        </span>
        <span className="text-sm text-(--color-muted-on-teal)">
          Junior Admin Gudang
        </span>
        <span className="col-span-2 mt-1 text-sm text-(--color-paper-on-teal)/85">
          Cocok karena Excel dan pengalaman inventory.
        </span>
      </div>
    ),
  },
  {
    n: "03",
    title: "Dapat rencana belajar yang singkat dan masuk akal",
    body: "Bukan daftar kursus tanpa arah. Tiga sampai lima langkah konkret yang langsung menutup skill gap untuk posisi yang kamu mau.",
    miniLabel: "Rencana belajar",
    miniContent: (
      <ul className="mt-3 space-y-1.5 text-sm">
        {[
          { label: "Excel for Data", done: true },
          { label: "Pengenalan WMS", done: false },
          { label: "Mini project gudang", done: false },
        ].map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-(--color-paper-on-teal)"
          >
            <span
              className={
                item.done
                  ? "flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-(--color-paper-on-teal)"
                  : "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-(--color-paper-on-teal)/40"
              }
              aria-hidden
            >
              {item.done && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path
                    d="M1.5 4.5L3.5 6.5L7.5 2"
                    stroke="var(--color-teal-band)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={
                item.done
                  ? "text-(--color-muted-on-teal) line-through"
                  : undefined
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="bg-(--color-teal-band) text-(--color-paper-on-teal)"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted-on-teal)">
            Bagaimana Akselerja bekerja
          </p>
          <h2
            id="how-heading"
            className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight"
          >
            Tiga langkah, satu logika yang sama: kamu tahu posisimu, kamu tahu
            langkah berikutnya.
          </h2>
        </Reveal>

        <ol className="mt-16 space-y-16 sm:space-y-20">
          {steps.map((step, i) => (
            <Reveal
              as="div"
              key={step.n}
              delay={i * 100}
              className="grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-12"
            >
              <div className="text-6xl font-semibold tracking-tight text-(--color-paper-on-teal)/35 sm:text-7xl">
                {step.n}
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted-on-teal)">
                  {step.body}
                </p>
                <div className="mt-6 inline-block min-w-72 max-w-md rounded-md border border-(--color-line-on-teal) bg-(--color-teal-deep)/40 px-4 py-3.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted-on-teal)">
                    {step.miniLabel}
                  </p>
                  {step.miniContent}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

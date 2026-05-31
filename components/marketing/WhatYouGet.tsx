import Reveal from "./Reveal";

const outcomes = [
  {
    lead: "Kamu akan tahu",
    body: "kenapa kamu cocok atau belum cocok untuk satu posisi, sebelum melamar. Bukan tebakan, bukan harapan.",
  },
  {
    lead: "Kamu akan punya",
    body: "rencana belajar 3 sampai 5 langkah yang langsung menutup skill gap untuk pekerjaan yang kamu mau.",
  },
  {
    lead: "Kamu akan bisa",
    body: "menunjukkan profil kompetensi yang lebih lengkap dari sekadar CV satu halaman, dan terus membangunnya.",
  },
  {
    lead: "Kamu akan lebih siap",
    body: "saat dipanggil interview, karena kamu sudah tahu skill apa yang akan ditanyakan dan jawaban apa yang relevan.",
  },
];

export default function WhatYouGet() {
  return (
    <section
      aria-labelledby="outcomes-heading"
      className="border-t border-(--color-line) bg-(--color-paper)"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-2xl">
          <h2
            id="outcomes-heading"
            className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-tight text-(--color-ink)"
          >
            Bukan janji bahwa kamu akan langsung dapat kerja. Janji bahwa kamu
            akan tahu apa yang harus dilakukan minggu ini.
          </h2>
        </Reveal>

        <Reveal className="mt-14 grid gap-y-10 gap-x-12 sm:grid-cols-2 sm:gap-y-14">
          {outcomes.map((o) => (
            <div
              key={o.lead}
              className="border-t border-(--color-line) pt-6 first:border-t sm:border-t"
            >
              <p className="text-sm font-medium uppercase tracking-wider text-(--color-teal)">
                {o.lead}
              </p>
              <p className="mt-3 text-lg leading-relaxed text-(--color-ink)">
                {o.body}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

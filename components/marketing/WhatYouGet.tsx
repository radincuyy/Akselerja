import Reveal from "./Reveal";

const outcomes = [
  {
    lead: "Match Score Berbasis Data",
    title: "Tahu kecocokanmu sebelum melamar",
    body: "Bukan tebakan, bukan harapan kosong. Setiap lowongan dianalisis secara instan untuk membandingkan kecocokan skill-mu saat ini dengan kebutuhan pasar yang nyata.",
    colSpan: "md:col-span-3",
    tag: "Tutup Gap",
  },
  {
    lead: "Peta Jalan Terpandu",
    title: "Rencana belajar 3-5 langkah",
    body: "Sistem secara otomatis menyusun langkah konkret dan modul belajar yang fokus 100% pada skill gap milikmu untuk lowongan sasaran.",
    colSpan: "md:col-span-2",
    tag: "Aksi Nyata",
  },
  {
    lead: "Portofolio Kompetensi",
    title: "Profil kredibilitas terverifikasi",
    body: "Buktikan kemampuan teknismu secara otentik lewat pengerjaan latihan kasus nyata yang lebih kredibel dibanding sekadar daftar skill di selembar CV kertas biasa.",
    colSpan: "md:col-span-2",
    tag: "Bukti Nyata",
  },
  {
    lead: "Simulasi Wawancara",
    title: "Lebih siap menghadapi rekruter",
    body: "Dapatkan prediksi pertanyaan teknis spesifik untuk lowongan sasaran beserta latihan cara menjawab terstruktur agar kamu bersinar saat interview.",
    colSpan: "md:col-span-3",
    tag: "Interview Prep",
  },
];

export default function WhatYouGet() {
  return (
    <section
      aria-labelledby="outcomes-heading"
      className="border-t border-(--color-line) bg-(--color-paper)"
    >
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-3xl">
          <h2
            id="outcomes-heading"
            className="text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tighter leading-[1.05] text-(--color-ink)"
          >
            Bukan janji bahwa kamu akan langsung dapat kerja. Janji bahwa kamu
            akan tahu apa yang harus dilakukan minggu ini.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 grid-cols-1 md:grid-cols-5">
          {outcomes.map((o, i) => (
            <Reveal
              key={o.title}
              delay={i * 100}
              className={`${o.colSpan} flex flex-col justify-between rounded-[2rem] border border-slate-200/40 bg-white p-8 sm:p-10 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.85)] hover:scale-[1.015] hover:-translate-y-1.5 hover:shadow-[0_35px_70px_-15px_rgba(0,0,0,0.06)] active:scale-[0.985] active:translate-y-0 transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] group cursor-pointer`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-(--color-teal)/90">
                    {o.lead}
                  </p>
                  <span className="rounded-full bg-(--color-tint) px-2.5 py-0.5 text-[10px] font-semibold text-(--color-ink) border border-slate-200/30">
                    {o.tag}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-(--color-ink) sm:text-2xl group-hover:text-(--color-teal) transition-colors duration-300">
                  {o.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-(--color-muted) max-w-[65ch]">
                  {o.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


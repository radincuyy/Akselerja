import Reveal from "./Reveal";

export default function ProblemRecognition() {
  return (
    <section
      aria-labelledby="problem-heading"
      className="border-t border-(--color-line) bg-(--color-paper)"
    >
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
        <Reveal>
          <h2
            id="problem-heading"
            className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)"
          >
            Lamaran tanpa jawaban bukan tentang kamu kurang. Sering kali
            tentang kamu tidak tahu apa yang ditunggu pasar.
          </h2>
          <div className="mt-7 space-y-5 text-lg leading-relaxed text-(--color-muted)">
            <p>
              Banyak pencari kerja Indonesia mengirim puluhan lamaran tanpa
              tahu kenapa tidak dipanggil. Apakah karena pengalaman? Karena
              skill yang tidak tertulis? Karena posisi memang tidak cocok
              sejak awal?
            </p>
            <p>
              Akselerja mengubah pertanyaan itu jadi jawaban yang konkret.
              Setiap kali kamu melihat satu lowongan, kamu tahu seberapa
              cocok, kenapa, dan apa yang bisa kamu pelajari supaya peluang
              kamu lebih besar minggu depan, bukan tahun depan.
            </p>
            <p className="text-(--color-ink)">
              Tidak ada angka tanpa penjelasan. Tidak ada saran tanpa langkah.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import Reveal from "./Reveal";

const faqs = [
  {
    q: "Berapa biaya pakai Akselerja?",
    a: "Untuk pencari kerja, gratis. Membuat profil, melihat match score, dan mendapat rekomendasi pelatihan tidak dipungut biaya. Kursus pihak ketiga punya harganya sendiri, dan kami tampilkan biayanya sebelum kamu memilih.",
  },
  {
    q: "Siapa yang bisa lihat data dan CV saya?",
    a: "Hanya kamu, kecuali kamu memilih untuk menampilkan profil ke perusahaan. Kamu bisa kapan saja menyembunyikan profil, mengontrol bagian mana yang dibagikan, atau menghapus akun beserta seluruh datanya.",
  },
  {
    q: "Bagaimana cara kerja matching-nya, kenapa skornya bisa berbeda?",
    a: "Skor dihitung dari kombinasi skill yang sesuai, pengalaman, pendidikan, dan potensi belajar. Setiap skor selalu disertai penjelasan komponen mana yang paling memengaruhi, jadi kamu tidak perlu menebak.",
  },
  {
    q: "Saya belum punya CV, masih bisa daftar?",
    a: "Bisa. Saat mendaftar, kamu bisa langsung mengisi profil tanpa CV. Kami akan menanyakan pendidikan, pengalaman, skill, dan minatmu satu per satu, dengan bahasa yang lugas. Selesai itu, profilmu sudah cukup untuk match score awal.",
  },
  {
    q: "Kapan saya bisa mulai melamar pekerjaan setelah daftar?",
    a: "Setelah profil lengkap, kamu sudah bisa melihat lowongan yang cocok dan melamar via partner. Kamu juga bisa terus melengkapi profil untuk skor yang lebih akurat.",
  },
  {
    q: "Apakah saya akan dipaksa ikut kursus berbayar?",
    a: "Tidak. Rekomendasi pelatihan adalah saran, bukan syarat. Kami juga menampilkan opsi gratis lebih dulu jika tersedia untuk skill yang kamu butuhkan.",
  },
];

export default function Faq() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="border-t border-(--color-line) bg-(--color-paper)"
    >
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal>
          <h2
            id="faq-heading"
            className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)"
          >
            Hal yang biasanya kamu ingin tahu sebelum daftar.
          </h2>
        </Reveal>

        <Reveal className="mt-12 divide-y divide-(--color-line) border-y border-(--color-line)">
          {faqs.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-medium text-(--color-ink) marker:hidden hover:text-(--color-teal) [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--color-line) text-(--color-muted) transition-transform duration-300 group-open:rotate-45 group-open:border-(--color-teal) group-open:text-(--color-teal)"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2v8M2 6h8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </summary>
              <div className="pb-6 pr-12 text-base leading-relaxed text-(--color-muted)">
                {item.a}
              </div>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

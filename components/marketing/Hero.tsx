import SignupForm from "./SignupForm";
import MatchScoreMock from "./MatchScoreMock";

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-32 lg:pt-28">
        <div>
          <p className="text-sm font-medium tracking-wide text-(--color-teal)">
            Untuk pencari kerja Indonesia
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-(--color-ink)"
          >
            Cari kerja yang cocok dengan kemampuanmu, dengan langkah yang
            jelas.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-(--color-muted)">
            Akselerja menunjukkan posisimu sekarang, kenapa kamu cocok atau
            belum, dan apa yang harus kamu pelajari berikutnya. Tanpa jargon,
            tanpa skor kosong tanpa arti.
          </p>

          <div className="mt-9 max-w-md">
            <SignupForm />
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <MatchScoreMock />
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-(--color-line)"
      />
    </section>
  );
}

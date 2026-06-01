import SignupForm from "./SignupForm";
import MatchScoreMock from "./MatchScoreMock";

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(64,128,150,0.03),transparent_50%)]"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-32 lg:pt-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-(--color-teal)/90">
            Untuk pencari kerja Indonesia
          </p>
          <h1
            id="hero-heading"
            className="mt-5 text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-(--color-ink)"
          >
            Cari kerja yang cocok dengan kemampuanmu, dengan langkah yang
            jelas.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-(--color-muted) max-w-[50ch]">
            Akselerja menunjukkan posisimu sekarang, kenapa kamu cocok atau
            belum, dan apa yang harus kamu pelajari berikutnya. Tanpa jargon,
            tanpa skor kosong tanpa arti.
          </p>

          <div className="mt-9 max-w-md">
            <SignupForm />
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          {/* Decorative blur highlights for dimensional depth */}
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-500/5 opacity-40 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-80 w-80 rounded-full bg-amber-500/5 opacity-30 blur-3xl pointer-events-none" />

          <MatchScoreMock />

          {/* Floating premium micro-chips */}
          <div className="absolute -left-4 top-12 hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200/40 bg-white/90 backdrop-blur-md p-3.5 shadow-xl shadow-slate-100/50 animate-float [animation-delay:1.5s] pointer-events-none">
            <span className="flex h-2.5 w-2.5 rounded-full bg-(--color-signal-green) animate-pulse" />
            <span className="text-xs font-semibold text-(--color-ink) tracking-tight">Match Terverifikasi</span>
          </div>

          <div className="absolute -right-6 bottom-16 hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200/40 bg-white/90 backdrop-blur-md p-3.5 shadow-xl shadow-slate-100/50 animate-float [animation-delay:3.5s] pointer-events-none">
            <span className="text-xs font-semibold text-(--color-teal) tracking-tight">100% Langkah Konkret</span>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-(--color-line)"
      />
    </section>
  );
}

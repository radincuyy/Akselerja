import Reveal from "./Reveal";
import SignupForm from "./SignupForm";

export default function ClosingCta() {
  return (
    <section
      aria-labelledby="closing-heading"
      className="bg-(--color-teal-band) text-(--color-paper-on-teal)"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted-on-teal)">
            Mulai gratis
          </p>
          <h2
            id="closing-heading"
            className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight"
          >
            Langkah pertama biasanya yang paling sulit. Kami buat itu jadi
            10 menit.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-(--color-muted-on-teal)">
            Mulai dengan email saja. CV dan profil lengkap kamu isi di langkah
            berikutnya, sesuai kecepatan kamu.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-lg border border-(--color-line-on-teal) bg-(--color-teal-deep)/45 p-6 sm:p-7">
            <SignupForm variant="dark" ctaLabel="Daftar gratis" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

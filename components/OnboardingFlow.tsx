"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "cv" | "profile" | "preferences";
const steps: { id: Step; label: string }[] = [
  { id: "cv", label: "CV" },
  { id: "profile", label: "Profil" },
  { id: "preferences", label: "Preferensi" },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("cv");
  const [submitting, setSubmitting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[] | null>(null);

  function next() {
    if (step === "cv") setStep("profile");
    else if (step === "profile") setStep("preferences");
  }
  function back() {
    if (step === "profile") setStep("cv");
    else if (step === "preferences") setStep("profile");
  }

  async function handleCvSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setExtractedSkills([
      "Microsoft Excel",
      "Inventory Management",
      "Komunikasi",
      "Ketelitian",
      "Customer Service",
    ]);
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push("/app");
  }

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div>
      <ol className="flex items-center gap-3" aria-label="Progress onboarding">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <li key={s.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className={
                  done
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-(--color-teal) text-xs font-semibold text-(--color-paper-on-teal)"
                    : active
                      ? "flex h-7 w-7 items-center justify-center rounded-full border-2 border-(--color-teal) text-xs font-semibold text-(--color-teal)"
                      : "flex h-7 w-7 items-center justify-center rounded-full border border-(--color-line) text-xs font-medium text-(--color-muted)"
                }
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={
                  active
                    ? "text-sm font-medium text-(--color-ink)"
                    : "text-sm text-(--color-muted)"
                }
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="hidden h-px w-12 bg-(--color-line) sm:block"
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-10">
        {step === "cv" && (
          <section aria-labelledby="cv-heading">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
              Langkah 1 dari 3
            </p>
            <h2
              id="cv-heading"
              className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-(--color-ink)"
            >
              Unggah CV (opsional)
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted)">
              Kalau punya CV, kami akan ekstrak skill, pendidikan, dan
              pengalaman kerjamu otomatis. Tidak punya? Lewati saja, isi
              manual di langkah berikutnya.
            </p>

            {!extractedSkills ? (
              <form onSubmit={handleCvSubmit} className="mt-8 max-w-md">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required
                  className="block w-full rounded-md border border-dashed border-(--color-line) bg-(--color-tint) px-4 py-6 text-sm text-(--color-muted) file:mr-3 file:rounded file:border-0 file:bg-(--color-paper) file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-(--color-ink)"
                />
                <p className="mt-2 text-xs text-(--color-muted)">
                  Format PDF, DOC, atau DOCX. Maksimal 5 MB.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
                  >
                    {submitting ? "Mengekstrak…" : "Unggah dan ekstrak skill"}
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-(--color-line) px-5 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
                  >
                    Lewati, isi manual
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-8 max-w-md rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
                <p className="text-sm font-semibold text-(--color-ink)">
                  CV berhasil dibaca
                </p>
                <p className="mt-1 text-sm leading-relaxed text-(--color-muted)">
                  Kami menemukan {extractedSkills.length} skill dari CV-mu.
                  Cek di langkah berikutnya, kamu bisa edit atau tambah
                  skill yang belum tertulis.
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {extractedSkills.map((s) => (
                    <li
                      key={s}
                      className="rounded-full bg-(--color-paper) px-3 py-1 text-xs font-medium text-(--color-ink)"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={next}
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                >
                  Lanjut ke profil
                </button>
              </div>
            )}
          </section>
        )}

        {step === "profile" && (
          <section aria-labelledby="profile-heading">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
              Langkah 2 dari 3
            </p>
            <h2
              id="profile-heading"
              className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-(--color-ink)"
            >
              Lengkapi profil singkat
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="mt-8 grid max-w-xl gap-5 sm:grid-cols-2"
            >
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                  Pendidikan terakhir
                </label>
                <input
                  type="text"
                  required
                  defaultValue="D3 Manajemen Logistik · Politeknik APP Jakarta"
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                  Tahun pengalaman kerja
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={50}
                  defaultValue={1}
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                  Lokasi sekarang
                </label>
                <input
                  type="text"
                  required
                  defaultValue="Bekasi, Jawa Barat"
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                  Tentang kamu (1-2 kalimat)
                </label>
                <textarea
                  rows={3}
                  defaultValue="Fresh graduate D3 Logistik dengan pengalaman magang 1 tahun di gudang ritel. Tertarik di bidang logistik dan operasional."
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
                />
              </div>
              <div className="flex justify-between gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-5 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                >
                  Lanjut ke preferensi
                </button>
              </div>
            </form>
          </section>
        )}

        {step === "preferences" && (
          <section aria-labelledby="prefs-heading">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
              Langkah 3 dari 3
            </p>
            <h2
              id="prefs-heading"
              className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-(--color-ink)"
            >
              Apa yang kamu cari?
            </h2>
            <form onSubmit={handleSubmit} className="mt-8 grid max-w-xl gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                  Tipe pekerjaan
                </label>
                <select
                  required
                  defaultValue="Full-time"
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Kontrak</option>
                  <option>Magang</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                  Ekspektasi gaji bulanan (Rp)
                </label>
                <input
                  type="number"
                  required
                  defaultValue={5000000}
                  step={500000}
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                  Industri yang diminati
                </label>
                <input
                  type="text"
                  defaultValue="Logistik, Manufaktur, Ritel"
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal)"
                />
                <p className="text-xs text-(--color-muted)">
                  Pisahkan dengan koma. Bisa diubah kapan saja dari profil.
                </p>
              </div>
              <div className="flex justify-between gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-5 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-60"
                >
                  {submitting ? "Menyimpan…" : "Selesai, masuk ke beranda"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

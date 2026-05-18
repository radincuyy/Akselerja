"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeOnboarding,
  uploadCvForReview,
} from "@/lib/profile-actions";
import type {
  OnboardingPreferencesInput,
  ParsedCvPreview,
} from "@/lib/profile-actions";
import type { JobType, WorkMode } from "@/lib/types";
import {
  CITY_OPTIONS,
  INDUSTRY_OPTIONS,
} from "@/lib/preferences-options";
import MultiSelectInput from "@/components/MultiSelectInput";

type Step = "preferences" | "cv";

const JOB_TYPES: { value: JobType; label: string; hint: string }[] = [
  { value: "Full-time", label: "Full-time", hint: "Kerja penuh waktu" },
  { value: "Part-time", label: "Part-time", hint: "Paruh waktu" },
  { value: "Kontrak", label: "Kontrak", hint: "Kontrak proyek atau periode tertentu" },
  { value: "Magang", label: "Magang", hint: "Internship, fresh graduate friendly" },
];

const WORK_MODES: { value: WorkMode; label: string; hint: string }[] = [
  { value: "onsite", label: "Onsite", hint: "Datang ke kantor setiap hari kerja" },
  { value: "hybrid", label: "Hybrid", hint: "Campuran kantor dan remote" },
  { value: "remote", label: "Remote", hint: "Kerja dari mana saja" },
];

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function OnboardingFlow() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("preferences");
  const [submitting, setSubmitting] = useState(false);
  const [parseStatus, setParseStatus] = useState<
    "idle" | "uploading" | "parsing"
  >("idle");
  const [parseError, setParseError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [jobTypes, setJobTypes] = useState<JobType[]>(["Full-time"]);
  const [workModes, setWorkModes] = useState<WorkMode[]>(["onsite"]);
  const [cities, setCities] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  const [preferences, setPreferences] =
    useState<OnboardingPreferencesInput | null>(null);

  const jobTypeId = useId();
  const workModeId = useId();
  const cvId = useId();

  function handlePreferencesSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (jobTypes.length === 0) {
      setError("Pilih minimal satu tipe pekerjaan.");
      return;
    }
    if (workModes.length === 0) {
      setError("Pilih minimal satu mode kerja.");
      return;
    }
    if (cities.length === 0) {
      setError("Pilih minimal satu kota.");
      return;
    }
    setError(null);
    setPreferences({
      preferredJobTypes: jobTypes,
      preferredWorkModes: workModes,
      preferredCities: cities,
      industries,
    });
    setStep("cv");
  }

  async function handleCvSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!preferences) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setParseError("Pilih file CV dulu atau klik lewati.");
      return;
    }
    setParseError(null);
    setSubmitting(true);
    setParseStatus("uploading");
    const formData = new FormData();
    formData.append("cv", file);
    const result = await uploadCvForReview(formData);
    if ("error" in result) {
      setSubmitting(false);
      setParseStatus("idle");
      setParseError(result.error);
      return;
    }
    setParseStatus("parsing");
    try {
      await completeOnboarding({
        preferences,
        cv: {
          filename: result.filename,
          sizeBytes: result.sizeBytes,
          blobName: result.blobName,
          contentType: result.contentType,
          skills: result.skills,
          education: result.education,
          experience: result.experience,
        },
      });
      router.push("/app");
    } catch (err) {
      setSubmitting(false);
      setParseStatus("idle");
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan profil. Coba lagi.",
      );
    }
  }

  async function handleSkipCv() {
    if (!preferences) return;
    setSubmitting(true);
    try {
      await completeOnboarding({ preferences });
      router.push("/app");
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan profil. Coba lagi.",
      );
    }
  }

  const stepIndex = step === "preferences" ? 0 : 1;

  return (
    <div>
      <ol className="flex items-center gap-3" aria-label="Progress onboarding">
        {[
          { id: "preferences", label: "Preferensi" },
          { id: "cv", label: "CV" },
        ].map((s, i) => {
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
              {i < 1 && (
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
        {step === "preferences" && (
          <section aria-labelledby="prefs-heading">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
              Langkah 1 dari 2
            </p>
            <h2
              id="prefs-heading"
              className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-(--color-ink)"
            >
              Pekerjaan seperti apa yang kamu cari?
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted)">
              Pilih semua yang sesuai. Kamu bisa pilih lebih dari satu tipe,
              mode kerja, kota, atau industri. Bisa diubah kapan saja dari
              profil.
            </p>

            <form onSubmit={handlePreferencesSubmit} className="mt-8 grid max-w-2xl gap-7">
              <fieldset className="flex flex-col gap-3">
                <legend
                  id={jobTypeId}
                  className="text-xs font-medium tracking-wide text-(--color-muted)"
                >
                  Tipe pekerjaan
                </legend>
                <div
                  role="group"
                  aria-labelledby={jobTypeId}
                  className="flex flex-wrap gap-2"
                >
                  {JOB_TYPES.map((opt) => {
                    const checked = jobTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() =>
                          setJobTypes((prev) => toggle(prev, opt.value))
                        }
                        title={opt.hint}
                        className={
                          checked
                            ? "rounded-full border border-(--color-teal) bg-(--color-teal) px-4 py-1.5 text-sm font-medium text-(--color-paper-on-teal)"
                            : "rounded-full border border-(--color-line) bg-(--color-paper) px-4 py-1.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend
                  id={workModeId}
                  className="text-xs font-medium tracking-wide text-(--color-muted)"
                >
                  Mode kerja
                </legend>
                <div
                  role="group"
                  aria-labelledby={workModeId}
                  className="flex flex-wrap gap-2"
                >
                  {WORK_MODES.map((opt) => {
                    const checked = workModes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() =>
                          setWorkModes((prev) => toggle(prev, opt.value))
                        }
                        title={opt.hint}
                        className={
                          checked
                            ? "rounded-full border border-(--color-teal) bg-(--color-teal) px-4 py-1.5 text-sm font-medium text-(--color-paper-on-teal)"
                            : "rounded-full border border-(--color-line) bg-(--color-paper) px-4 py-1.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <MultiSelectInput
                label="Kota"
                placeholder="Ketik atau pilih kota"
                options={CITY_OPTIONS}
                values={cities}
                onChange={setCities}
              />

              <MultiSelectInput
                label="Industri yang diminati"
                optional
                placeholder="Ketik atau pilih industri"
                options={INDUSTRY_OPTIONS}
                values={industries}
                onChange={setIndustries}
                helperText="Boleh dilewati. Bisa diubah kapan saja dari profil."
              />

              {error && (
                <p role="alert" className="text-sm text-(--color-signal-clay)">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                >
                  Lanjut ke unggah CV
                </button>
              </div>
            </form>
          </section>
        )}

        {step === "cv" && (
          <section aria-labelledby="cv-heading">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
              Langkah 2 dari 2
            </p>
            <h2
              id="cv-heading"
              className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-(--color-ink)"
            >
              Unggah CV-mu
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-(--color-muted)">
              AI kami akan baca CV-mu dan ekstrak skill, riwayat pendidikan,
              serta pengalaman. Proses 10–15 detik. Setelah selesai, kamu
              langsung masuk ke beranda dengan rekomendasi lowongan yang sesuai.
            </p>

            <form onSubmit={handleCvSubmit} className="mt-8 max-w-md">
              <label htmlFor={cvId} className="sr-only">
                Pilih file CV
              </label>
              <input
                ref={fileInputRef}
                id={cvId}
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={submitting}
                className="block w-full rounded-md border border-dashed border-(--color-line) bg-(--color-tint) px-4 py-6 text-sm text-(--color-muted) file:mr-3 file:rounded file:border-0 file:bg-(--color-paper) file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-(--color-ink)"
              />
              <p className="mt-2 text-xs text-(--color-muted)">
                Format PDF, DOC, atau DOCX. Maksimal 5 MB.
              </p>

              {parseStatus !== "idle" && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-4 rounded-md border border-(--color-line) bg-(--color-tint) px-4 py-3 text-sm text-(--color-ink)"
                >
                  {parseStatus === "uploading"
                    ? "Mengunggah CV ke storage…"
                    : "AI sedang membaca CV-mu, sebentar ya…"}
                </div>
              )}

              {parseError && (
                <p role="alert" className="mt-3 text-sm text-(--color-signal-clay)">
                  {parseError}
                </p>
              )}
              {error && (
                <p role="alert" className="mt-3 text-sm text-(--color-signal-clay)">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
                >
                  {submitting ? "Memproses…" : "Unggah dan analisis CV"}
                </button>
                <button
                  type="button"
                  onClick={handleSkipCv}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-(--color-line) px-5 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink) disabled:opacity-60"
                >
                  Lewati, isi profil nanti
                </button>
                <button
                  type="button"
                  onClick={() => setStep("preferences")}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-2 py-2.5 text-sm font-medium text-(--color-muted) hover:text-(--color-ink) disabled:opacity-60"
                >
                  ← Kembali ke preferensi
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { saveProfile, type SaveProfileResult } from "@/lib/profile-actions";
import type { Candidate, Education, Experience } from "@/lib/types";

type Props = {
  profile: Candidate;
};

type EduDraft = Education & { _new?: boolean; _confirmDelete?: boolean };
type ExpDraft = Experience & { _new?: boolean; _confirmDelete?: boolean };

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ProfileEditForm({ profile }: Props) {
  const initialEducation: EduDraft[] = (profile.education ?? []).map((e) => ({ ...e }));
  const initialExperience: ExpDraft[] = (profile.experience ?? []).map((x) => ({ ...x }));

  const [education, setEducation] = useState<EduDraft[]>(initialEducation);
  const [experience, setExperience] = useState<ExpDraft[]>(initialExperience);

  const [state, formAction] = useActionState<SaveProfileResult | null, FormData>(
    saveProfile,
    null,
  );

  // Dirty tracking, used to enable Save button and beforeunload.
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const errors = state && !state.ok ? state.errors : {};

  // Scroll to first error on submit failure.
  const errorAnchorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (state && !state.ok && errorAnchorRef.current) {
      errorAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  function addEducation() {
    setEducation((prev) => [
      ...prev,
      {
        id: uid("ed"),
        institution: "",
        degree: "",
        startMonth: "",
        endMonth: "",
        notes: "",
        _new: true,
      },
    ]);
    setDirty(true);
  }
  function removeEducation(id: string) {
    setEducation((prev) => prev.filter((e) => e.id !== id));
    setDirty(true);
  }
  function toggleConfirmEdu(id: string) {
    setEducation((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, _confirmDelete: !e._confirmDelete } : { ...e, _confirmDelete: false },
      ),
    );
  }

  function addExperience() {
    setExperience((prev) => [
      ...prev,
      {
        id: uid("ex"),
        position: "",
        company: "",
        startMonth: "",
        endMonth: "",
        duties: "",
        _new: true,
      },
    ]);
    setDirty(true);
  }
  function removeExperience(id: string) {
    setExperience((prev) => prev.filter((x) => x.id !== id));
    setDirty(true);
  }
  function toggleConfirmExp(id: string) {
    setExperience((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, _confirmDelete: !x._confirmDelete } : { ...x, _confirmDelete: false },
      ),
    );
  }

  return (
    <form action={formAction} onChange={() => setDirty(true)} className="mt-10 space-y-12">
      <div ref={errorAnchorRef} aria-hidden />
      {state && !state.ok ? (
        <div
          role="alert"
          className="rounded-lg border border-(--color-signal-clay) bg-(--color-tint) p-4 text-sm leading-relaxed text-(--color-ink)"
        >
          <p className="font-semibold text-(--color-signal-clay)">
            Beberapa isian belum lengkap
          </p>
          <p className="mt-1">
            Periksa field yang ditandai di bawah, lalu coba simpan ulang.
          </p>
        </div>
      ) : null}

      <section aria-labelledby="basic-heading">
        <h2
          id="basic-heading"
          className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
        >
          Inti
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field
            name="name"
            label="Nama lengkap"
            defaultValue={profile.name}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Field
            name="location"
            label="Lokasi"
            defaultValue={profile.location}
            error={errors.location}
            placeholder="Kota, Provinsi"
            required
          />
          <div className="sm:col-span-2">
            <Field
              name="bio"
              label="Tentang kamu"
              type="textarea"
              defaultValue={profile.bio}
              error={errors.bio}
              helper="Tulis dalam 1 sampai 2 kalimat. Yang HR baca, bukan judul, tapi cara kamu cerita tentang dirimu."
              required
              maxLength={280}
            />
          </div>
          <Field
            name="experienceYears"
            label="Tahun pengalaman"
            type="number"
            defaultValue={String(profile.experienceYears)}
            error={errors.experienceYears}
            min={0}
            max={60}
            required
          />
          <Field
            name="expectedSalary"
            label="Ekspektasi gaji bulanan"
            type="number"
            step={500000}
            defaultValue={String(profile.expectedSalary)}
            error={errors.expectedSalary}
            helper="Bulanan, dalam Rupiah. Akselerja tidak menampilkan angka ini ke perusahaan kecuali kamu sudah melamar lowongan mereka."
            required
          />
          <div className="sm:col-span-2">
            <Field
              name="email"
              label="Email kontak"
              type="email"
              defaultValue={profile.email}
              error={errors.email}
              autoComplete="email"
              required
            />
          </div>
        </div>
      </section>

      <section id="pendidikan" aria-labelledby="edu-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="edu-heading"
            className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
          >
            Pendidikan
          </h2>
          <p className="text-xs text-(--color-muted)">{education.length} entri</p>
        </div>

        {education.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
            Tambah pendidikan terakhir. Kamu boleh skip kalau profilmu fokus
            ke pengalaman kerja.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {education.map((e, i) => (
              <EducationRow
                key={e.id}
                index={i}
                edu={e}
                error={errors[`edu-${i}`]}
                onConfirmToggle={() => toggleConfirmEdu(e.id)}
                onConfirmDelete={() => removeEducation(e.id)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addEducation}
          className="mt-5 inline-flex items-center gap-2 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M7 3v8M3 7h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          Tambah pendidikan
        </button>
      </section>

      <section id="pengalaman" aria-labelledby="exp-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="exp-heading"
            className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
          >
            Pengalaman kerja
          </h2>
          <p className="text-xs text-(--color-muted)">{experience.length} entri</p>
        </div>

        {experience.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
            Belum ada pengalaman kerja? Tidak masalah. Tambah magang, projek
            mandiri, atau organisasi yang related dengan target pekerjaanmu.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {experience.map((x, i) => (
              <ExperienceRow
                key={x.id}
                index={i}
                exp={x}
                error={errors[`exp-${i}`]}
                onConfirmToggle={() => toggleConfirmExp(x.id)}
                onConfirmDelete={() => removeExperience(x.id)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addExperience}
          className="mt-5 inline-flex items-center gap-2 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M7 3v8M3 7h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          Tambah pengalaman
        </button>
      </section>

      <FormActions dirty={dirty} />
    </form>
  );
}

function FormActions({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-(--color-line) bg-(--color-paper) px-5 py-4 sm:-mx-8 sm:px-8">
      <Link
        href="/app/profil"
        className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-(--color-muted) hover:text-(--color-ink)"
      >
        Batal
      </Link>
      <button
        type="submit"
        disabled={!dirty || pending}
        className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-50"
      >
        {pending ? (
          <>
            <span
              aria-hidden
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--color-paper-on-teal)/40 border-t-(--color-paper-on-teal)"
            />
            Menyimpan…
          </>
        ) : (
          "Simpan perubahan"
        )}
      </button>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  helper?: string;
  type?: "text" | "email" | "number" | "textarea" | "month";
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  inputClassName?: string;
};

function Field({
  name,
  label,
  defaultValue,
  error,
  helper,
  type = "text",
  placeholder,
  required,
  autoComplete,
  min,
  max,
  step,
  maxLength,
  inputClassName = "",
}: FieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const baseInput = `w-full rounded-md border bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal) ${
    error ? "border-(--color-signal-clay)" : "border-(--color-line)"
  } ${inputClassName}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-(--color-muted)">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          name={name}
          defaultValue={defaultValue}
          required={required}
          rows={3}
          maxLength={maxLength}
          aria-describedby={[helper ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(error)}
          className={`${baseInput} resize-none`}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          aria-describedby={[helper ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(error)}
          className={baseInput}
        />
      )}
      {helper ? (
        <p id={helperId} className="text-xs leading-relaxed text-(--color-muted)">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EducationRow({
  edu,
  index,
  error,
  onConfirmToggle,
  onConfirmDelete,
}: {
  edu: EduDraft;
  index: number;
  error?: string;
  onConfirmToggle: () => void;
  onConfirmDelete: () => void;
}) {
  // Auto-cancel confirm after 5s.
  useEffect(() => {
    if (!edu._confirmDelete) return;
    const t = setTimeout(onConfirmToggle, 5000);
    return () => clearTimeout(t);
  }, [edu._confirmDelete, onConfirmToggle]);

  return (
    <fieldset className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
      <legend className="px-1 text-xs font-medium tracking-wide text-(--color-muted)">
        Pendidikan {index + 1}
      </legend>
      <input type="hidden" name="eduId" value={edu.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="eduInstitution"
          label="Institusi"
          defaultValue={edu.institution}
          required
          placeholder="Politeknik APP Jakarta"
        />
        <Field
          name="eduDegree"
          label="Gelar atau jurusan"
          defaultValue={edu.degree}
          required
          placeholder="D3 Manajemen Logistik"
        />
        <Field
          name="eduStart"
          label="Mulai (bulan/tahun)"
          type="month"
          defaultValue={edu.startMonth}
        />
        <Field
          name="eduEnd"
          label="Selesai (bulan/tahun)"
          type="month"
          defaultValue={edu.endMonth}
          helper="Kosongkan kalau masih berjalan."
        />
        <div className="sm:col-span-2">
          <Field
            name="eduNotes"
            label="Catatan (opsional)"
            type="textarea"
            defaultValue={edu.notes ?? ""}
            placeholder="Konsentrasi, prestasi, atau hal lain yang relevan."
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs font-medium text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-end">
        {edu._confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConfirmDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-(--color-signal-clay) px-3 py-1.5 text-xs font-semibold text-(--color-signal-clay) hover:bg-(--color-tint)"
            >
              Yakin hapus?
            </button>
            <button
              type="button"
              onClick={onConfirmToggle}
              className="text-xs text-(--color-muted) hover:text-(--color-ink)"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfirmToggle}
            className="text-xs text-(--color-muted) hover:text-(--color-signal-clay)"
          >
            Hapus pendidikan ini
          </button>
        )}
      </div>
    </fieldset>
  );
}

function ExperienceRow({
  exp,
  index,
  error,
  onConfirmToggle,
  onConfirmDelete,
}: {
  exp: ExpDraft;
  index: number;
  error?: string;
  onConfirmToggle: () => void;
  onConfirmDelete: () => void;
}) {
  useEffect(() => {
    if (!exp._confirmDelete) return;
    const t = setTimeout(onConfirmToggle, 5000);
    return () => clearTimeout(t);
  }, [exp._confirmDelete, onConfirmToggle]);

  return (
    <fieldset className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
      <legend className="px-1 text-xs font-medium tracking-wide text-(--color-muted)">
        Pengalaman {index + 1}
      </legend>
      <input type="hidden" name="expId" value={exp.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="expPosition"
          label="Posisi"
          defaultValue={exp.position}
          required
          placeholder="Magang Admin Gudang"
        />
        <Field
          name="expCompany"
          label="Perusahaan"
          defaultValue={exp.company}
          required
          placeholder="CV Maju Bersama"
        />
        <Field
          name="expStart"
          label="Mulai (bulan/tahun)"
          type="month"
          defaultValue={exp.startMonth}
        />
        <Field
          name="expEnd"
          label="Selesai (bulan/tahun)"
          type="month"
          defaultValue={exp.endMonth}
          helper="Kosongkan kalau masih bekerja di sini."
        />
        <div className="sm:col-span-2">
          <Field
            name="expDuties"
            label="Tugas utama"
            type="textarea"
            defaultValue={exp.duties ?? ""}
            placeholder="3 sampai 4 kalimat tentang yang kamu kerjakan, hasil, dan dampaknya."
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs font-medium text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-end">
        {exp._confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConfirmDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-(--color-signal-clay) px-3 py-1.5 text-xs font-semibold text-(--color-signal-clay) hover:bg-(--color-tint)"
            >
              Yakin hapus?
            </button>
            <button
              type="button"
              onClick={onConfirmToggle}
              className="text-xs text-(--color-muted) hover:text-(--color-ink)"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfirmToggle}
            className="text-xs text-(--color-muted) hover:text-(--color-signal-clay)"
          >
            Hapus pengalaman ini
          </button>
        )}
      </div>
    </fieldset>
  );
}

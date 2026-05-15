"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createJobAction,
  updateJobAction,
  type SaveJobResult,
} from "@/lib/job-actions";
import type { Job, Skill } from "@/lib/types";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; job: Job };

type Props = {
  mode: Mode;
  skills: Skill[];
};

type ReqDraft = {
  key: string;
  skillId: string;
  required: 1 | 2 | 3;
  weight: number; // 0..1, normalized when displayed
};

const TYPES: Array<Job["type"]> = ["Full-time", "Part-time", "Kontrak", "Magang"];

const LEVEL_LABEL: Record<1 | 2 | 3, string> = {
  1: "Dasar",
  2: "Menengah",
  3: "Mahir",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function JobForm({ mode, skills }: Props) {
  const job = mode.kind === "edit" ? mode.job : null;

  const initialReqs: ReqDraft[] = (job?.requirements ?? []).map((r) => ({
    key: uid(),
    skillId: r.skillId,
    required: r.required,
    weight: r.weight ?? 0.2,
  }));

  const [requirements, setRequirements] = useState<ReqDraft[]>(initialReqs);
  const [dirty, setDirty] = useState(false);

  const action =
    mode.kind === "create"
      ? createJobAction
      : updateJobAction.bind(null, mode.job.id);

  const [state, formAction] = useActionState<SaveJobResult | null, FormData>(
    action,
    null,
  );

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

  const errorAnchorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (state && !state.ok && errorAnchorRef.current) {
      errorAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  const usedSkillIds = new Set(requirements.map((r) => r.skillId).filter(Boolean));
  const availableSkills = skills.filter((s) => !usedSkillIds.has(s.id));

  function addRequirement(skillId: string) {
    if (!skillId) return;
    setRequirements((prev) => [
      ...prev,
      { key: uid(), skillId, required: 2, weight: 0.2 },
    ]);
    setDirty(true);
  }

  function removeRequirement(key: string) {
    setRequirements((prev) => prev.filter((r) => r.key !== key));
    setDirty(true);
  }

  function setReqLevel(key: string, level: 1 | 2 | 3) {
    setRequirements((prev) =>
      prev.map((r) => (r.key === key ? { ...r, required: level } : r)),
    );
    setDirty(true);
  }

  function setReqWeight(key: string, weight: number) {
    setRequirements((prev) =>
      prev.map((r) => (r.key === key ? { ...r, weight } : r)),
    );
    setDirty(true);
  }

  const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
  const weightWarning =
    requirements.length > 0 && Math.abs(totalWeight - 1) > 0.05
      ? `Total bobot ${(totalWeight * 100).toFixed(0)}%. Idealnya mendekati 100%.`
      : null;

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
          Informasi posisi
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              name="title"
              label="Judul lowongan"
              defaultValue={job?.title ?? ""}
              error={errors.title}
              placeholder="Junior Admin Gudang"
              required
              maxLength={80}
            />
          </div>
          <Field
            name="company"
            label="Perusahaan"
            defaultValue={job?.company ?? ""}
            error={errors.company}
            placeholder="PT Cipta Logistik Nusantara"
            required
          />
          <Field
            name="location"
            label="Lokasi"
            defaultValue={job?.location ?? ""}
            error={errors.location}
            placeholder="Kota, Provinsi"
            required
          />
          <SelectField
            name="type"
            label="Tipe pekerjaan"
            defaultValue={job?.type ?? "Full-time"}
            error={errors.type}
            options={TYPES.map((t) => ({ value: t, label: t }))}
            required
          />
          <Field
            name="industry"
            label="Industri"
            defaultValue={job?.industry ?? ""}
            error={errors.industry}
            placeholder="Logistik"
            required
          />
          <Field
            name="salaryMin"
            label="Gaji minimum (Rp/bulan)"
            type="number"
            defaultValue={job ? String(job.salaryMin) : ""}
            error={errors.salaryMin}
            min={0}
            step={500000}
            placeholder="4500000"
          />
          <Field
            name="salaryMax"
            label="Gaji maksimum (Rp/bulan)"
            type="number"
            defaultValue={job ? String(job.salaryMax) : ""}
            error={errors.salaryMax}
            min={0}
            step={500000}
            placeholder="5500000"
          />
          <div className="sm:col-span-2">
            <Field
              name="description"
              label="Deskripsi"
              type="textarea"
              defaultValue={job?.description ?? ""}
              error={errors.description}
              helper="Jelaskan tugas utama, konteks tim, dan kandidat seperti apa yang cocok. Hindari jargon dan singkatan internal."
              required
              maxLength={2000}
              rows={6}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="req-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="req-heading"
            className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
          >
            Skill yang dibutuhkan
          </h2>
          <p className="text-xs text-(--color-muted)">
            {requirements.length} dari maksimal 8
          </p>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
          Pilih skill yang paling menentukan keberhasilan di posisi ini. Bobot
          menentukan seberapa besar pengaruh skill ini pada match score
          kandidat. Total bobot idealnya 100%.
        </p>

        {requirements.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed border-(--color-line) bg-(--color-tint) p-5 text-sm text-(--color-muted)">
            Belum ada skill ditambahkan. Pilih dari daftar di bawah.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {requirements.map((r, i) => {
              const skill = skills.find((s) => s.id === r.skillId);
              return (
                <li
                  key={r.key}
                  className="rounded-lg border border-(--color-line) bg-(--color-paper) p-4"
                >
                  <input type="hidden" name="reqSkillId" value={r.skillId} />
                  <input type="hidden" name="reqLevel" value={r.required} />
                  <input type="hidden" name="reqWeight" value={r.weight.toFixed(2)} />

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-(--color-ink)">
                        {skill?.name ?? r.skillId}
                      </p>
                      <p className="mt-0.5 text-xs text-(--color-muted)">
                        Skill {i + 1}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRequirement(r.key)}
                      className="text-xs text-(--color-muted) hover:text-(--color-signal-clay)"
                      aria-label={`Hapus ${skill?.name ?? r.skillId}`}
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium tracking-wide text-(--color-muted)">
                        Level dibutuhkan
                      </p>
                      <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label={`Level ${skill?.name}`}>
                        {([1, 2, 3] as const).map((lvl) => {
                          const active = r.required === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setReqLevel(r.key, lvl)}
                              className={
                                active
                                  ? "rounded-md bg-(--color-teal) px-3 py-1.5 text-xs font-medium text-(--color-paper-on-teal)"
                                  : "rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-1.5 text-xs font-medium text-(--color-muted) hover:border-(--color-ink)/40 hover:text-(--color-ink)"
                              }
                            >
                              {LEVEL_LABEL[lvl]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium tracking-wide text-(--color-muted)">
                        Bobot{" "}
                        <span className="tabular-nums text-(--color-ink)">
                          {Math.round(r.weight * 100)}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={60}
                        step={5}
                        value={Math.round(r.weight * 100)}
                        onChange={(e) =>
                          setReqWeight(r.key, Number(e.target.value) / 100)
                        }
                        className="mt-2 w-full accent-(--color-teal)"
                        aria-label={`Bobot ${skill?.name}`}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {errors.requirements ? (
          <p role="alert" className="mt-3 text-xs font-medium text-(--color-signal-clay)">
            {errors.requirements}
          </p>
        ) : null}
        {weightWarning ? (
          <p className="mt-3 text-xs text-(--color-signal-amber)">
            {weightWarning}
          </p>
        ) : null}

        {availableSkills.length > 0 && requirements.length < 8 ? (
          <SkillPicker skills={availableSkills} onAdd={addRequirement} />
        ) : null}
      </section>

      <FormActions dirty={dirty} mode={mode.kind} />
    </form>
  );
}

function SkillPicker({
  skills,
  onAdd,
}: {
  skills: Skill[];
  onAdd: (skillId: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-5 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="skill-picker" className="text-xs font-medium tracking-wide text-(--color-muted)">
          Tambah skill
        </label>
        <select
          id="skill-picker"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink) focus:border-(--color-teal)"
        >
          <option value="">— Pilih skill —</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={!value}
        onClick={() => {
          if (value) {
            onAdd(value);
            setValue("");
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink) disabled:opacity-50"
      >
        Tambah
      </button>
    </div>
  );
}

function FormActions({ dirty, mode }: { dirty: boolean; mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-(--color-line) bg-(--color-paper) px-5 py-4 sm:-mx-8 sm:px-8">
      <Link
        href="/hr/lowongan"
        className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-(--color-muted) hover:text-(--color-ink)"
      >
        Batal
      </Link>
      <button
        type="submit"
        disabled={(!dirty && mode === "edit") || pending}
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
        ) : mode === "create" ? (
          "Pasang lowongan"
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
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  rows?: number;
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
  min,
  max,
  step,
  maxLength,
  rows = 3,
}: FieldProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const baseInput = `w-full rounded-md border bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal) ${
    error ? "border-(--color-signal-clay)" : "border-(--color-line)"
  }`;
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
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
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

function SelectField({
  name,
  label,
  defaultValue,
  error,
  options,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-(--color-muted)">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) focus:border-(--color-teal) ${
          error ? "border-(--color-signal-clay)" : "border-(--color-line)"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}
    </div>
  );
}

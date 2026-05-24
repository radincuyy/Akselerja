"use client";

import { useId, useRef, useState, useTransition } from "react";
import {
  confirmCvUpdate,
  uploadCvForReview,
  type ParsedCvPreview,
} from "@/lib/profile-actions";
import type { CvFile } from "@/lib/types";

type Props = {
  currentCv?: CvFile;
};

type State =
  | { kind: "idle"; error?: string }
  | { kind: "uploading" }
  | { kind: "parsing" }
  | { kind: "review"; preview: ParsedCvPreview }
  | { kind: "confirming" };

const ALLOWED_EXT = [".pdf", ".doc", ".docx"];
const MAX_BYTES = 5 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateId(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CvUploader({ currentCv }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [, startTransition] = useTransition();

  function validate(file: File): string | null {
    const lower = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
      return "Format tidak didukung. Pakai PDF, DOC, atau DOCX.";
    }
    if (file.size > MAX_BYTES) {
      return `File ${formatBytes(file.size)} melebihi batas 5 MB. Kompres dulu atau pilih format lain.`;
    }
    if (file.size === 0) {
      return "File kosong, coba upload ulang.";
    }
    return null;
  }

  async function handleFile(file: File) {
    const validationError = validate(file);
    if (validationError) {
      setState({ kind: "idle", error: validationError });
      return;
    }
    setState({ kind: "uploading" });
    await new Promise((r) => setTimeout(r, 600));
    setState({ kind: "parsing" });

    const formData = new FormData();
    formData.append("cv", file);
    const result = await uploadCvForReview(formData);
    if ("error" in result) {
      setState({ kind: "idle", error: result.error });
      return;
    }
    setState({ kind: "review", preview: result });
  }

  function pickFile() {
    inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function reset() {
    setState({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function confirm() {
    if (state.kind !== "review") return;
    setState({ kind: "confirming" });
    const {
      filename,
      sizeBytes,
      blobName,
      contentType,
      personal,
      skills,
      education,
      experience,
      organizations,
      projects,
    } = state.preview;
    startTransition(async () => {
      await confirmCvUpdate({
        filename,
        sizeBytes,
        blobName,
        contentType,
        extractedPersonal: personal,
        extractedSkills: skills,
        extractedEducation: education,
        extractedExperience: experience,
        extractedOrganizations: organizations,
        extractedProjects: projects,
      });
    });
  }

  return (
    <div className="space-y-6">
      {currentCv ? (
        <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                CV saat ini
              </p>
              <p className="mt-2 break-words text-base font-medium text-(--color-ink)">
                {currentCv.filename}
              </p>
              <p className="mt-0.5 text-sm text-(--color-muted)">
                Diupload {formatDateId(currentCv.uploadedAt)}
                {currentCv.sizeBytes ? (
                  <>
                    {" "}
                    <span aria-hidden>·</span> {formatBytes(currentCv.sizeBytes)}
                  </>
                ) : null}
              </p>
            </div>
            {currentCv.blobName ? (
              <a
                href="/api/cv/current"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal) sm:w-auto"
              >
                Lihat CV
              </a>
            ) : null}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-(--color-muted)">
            Upload CV baru di bawah akan menggantikan yang ini setelah kamu
            konfirmasi.
          </p>
        </div>
      ) : null}

      {state.kind === "idle" ? (
        <div>
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={
              dragOver
                ? "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-(--color-teal) bg-(--color-teal-soft) px-6 py-10 text-center"
                : "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-(--color-line) bg-(--color-tint) px-6 py-10 text-center hover:border-(--color-ink)/40"
            }
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-(--color-muted)">
              <path
                d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-3 text-base font-medium text-(--color-ink)">
              {currentCv ? "Drop CV baru di sini atau klik untuk pilih" : "Drop CV di sini atau klik untuk pilih"}
            </p>
            <p className="mt-1 text-sm text-(--color-muted)">
              PDF, DOC, atau DOCX. Maksimal 5 MB.
            </p>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={pickFile}
              className="rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
            >
              Pilih file
            </button>
          </div>
          {state.error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-(--color-signal-clay)">
              {state.error}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.kind === "uploading" ? (
        <ProgressBlock label="Mengunggah ke server" sublabel="Sebentar, sambil menyiapkan parsing" />
      ) : null}

      {state.kind === "parsing" ? (
        <ProgressBlock
          label="Mengekstrak skill dan pengalaman"
          sublabel="Biasanya 1 sampai 3 detik."
          shimmer
        />
      ) : null}

      {state.kind === "review" ? (
        <ReviewPanel
          preview={state.preview}
          onCancel={reset}
          onConfirm={confirm}
        />
      ) : null}

      {state.kind === "confirming" ? (
        <ProgressBlock label="Menyimpan ke profil" sublabel="" />
      ) : null}
    </div>
  );
}

function ProgressBlock({
  label,
  sublabel,
  shimmer,
}: {
  label: string;
  sublabel: string;
  shimmer?: boolean;
}) {
  return (
    <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-line) border-t-(--color-teal)"
        />
        <p className="text-base font-medium text-(--color-ink)">{label}</p>
      </div>
      {sublabel ? (
        <p className="mt-2 text-sm text-(--color-muted)">{sublabel}</p>
      ) : null}
      {shimmer ? (
        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-(--color-line)">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-(--color-teal)" />
        </div>
      ) : null}
    </div>
  );
}

function ReviewPanel({
  preview,
  onCancel,
  onConfirm,
}: {
  preview: ParsedCvPreview;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
        Hasil ekstraksi
      </p>
      <h2 className="mt-2 text-lg font-semibold text-(--color-ink)">
        {preview.filename}
      </h2>
      <p className="mt-1 text-sm text-(--color-muted)">
        {formatBytes(preview.sizeBytes)}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-(--color-ink)">
            Skill yang ditemukan
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {preview.skills.map((s) => (
              <li
                key={s.id}
                className="rounded-full bg-(--color-tint) px-3 py-1 text-xs font-medium text-(--color-ink)"
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-(--color-ink)">
            Riwayat yang ditemukan
          </p>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-(--color-muted)">
            <li>
              <span className="font-medium text-(--color-ink)">
                {preview.education.length}
              </span>{" "}
              entri pendidikan
            </li>
            <li>
              <span className="font-medium text-(--color-ink)">
                {preview.experience.length}
              </span>{" "}
              entri pengalaman kerja
            </li>
          </ul>
        </div>
      </div>

      {preview.notes.length > 0 ? (
        <ul className="mt-6 space-y-1.5 text-sm leading-relaxed text-(--color-muted)">
          {preview.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
        >
          Konfirmasi update profil
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
        >
          Upload ulang
        </button>
      </div>
    </div>
  );
}

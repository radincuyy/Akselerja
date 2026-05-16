"use client";

import { useRef, useState, useTransition } from "react";
import { postHrNote, rateApplication } from "@/lib/actions";
import { formatRelativeId } from "@/lib/mock-data";
import type { HrNote } from "@/lib/types";

type Props = {
  applicationId: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  notes: HrNote[];
};

export default function HrNotesPanel({ applicationId, rating, notes }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [submitting, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  function setStars(value: number) {
    const next = rating === value ? 0 : value;
    startTransition(() => {
      void rateApplication(applicationId, next);
    });
  }

  function submitNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim()) return;
    const formData = new FormData();
    formData.append("note", draft);
    startTransition(async () => {
      await postHrNote(applicationId, formData);
      setDraft("");
      formRef.current?.reset();
    });
  }

  return (
    <section
      aria-labelledby="notes-heading"
      className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          id="notes-heading"
          className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
        >
          Catatan internal
        </h3>
        <p className="text-[11px] text-(--color-muted)">Hanya tim kamu yang lihat</p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium tracking-wide text-(--color-muted)">
          Rating kandidat
        </p>
        <div
          className="mt-1.5 flex items-center gap-1"
          onMouseLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hover ?? rating ?? 0) >= n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`Beri ${n} bintang`}
                aria-pressed={(rating ?? 0) >= n}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onClick={() => setStars(n)}
                className="group inline-flex h-11 w-11 items-center justify-center rounded-md"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className={
                    filled
                      ? "text-(--color-signal-amber) transition-colors"
                      : "text-(--color-line) transition-colors group-hover:text-(--color-signal-amber)/50"
                  }
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M10 2.5l2.36 4.78 5.27.77-3.81 3.71.9 5.24L10 14.55l-4.71 2.45.9-5.24-3.81-3.71 5.27-.77z" />
                </svg>
              </button>
            );
          })}
          {rating ? (
            <button
              type="button"
              onClick={() => setStars(0)}
              className="ml-2 text-xs text-(--color-muted) hover:text-(--color-ink)"
            >
              Hapus
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium tracking-wide text-(--color-muted)">
          Thread catatan
        </p>
        {notes.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
            Belum ada catatan. Tulis kesan, alasan shortlist, atau hal yang ingin
            kamu tanyakan saat interview.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-md bg-(--color-tint) p-3 text-sm leading-relaxed text-(--color-ink)"
              >
                <p>{n.text}</p>
                <p className="mt-1.5 text-[11px] text-(--color-muted)">
                  {n.authorName} <span aria-hidden>·</span>{" "}
                  {formatRelativeId(n.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <form ref={formRef} onSubmit={submitNote} className="mt-4 flex flex-col gap-2">
        <label htmlFor={`note-${applicationId}`} className="sr-only">
          Tambah catatan internal
        </label>
        <textarea
          id={`note-${applicationId}`}
          name="note"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          maxLength={400}
          placeholder="Catatan untuk dirimu sendiri atau tim…"
          className="w-full resize-none rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2.5 text-sm text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal)"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-(--color-muted)">
            {draft.length}/400 karakter
          </p>
          <button
            type="submit"
            disabled={!draft.trim() || submitting}
            className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-3.5 py-1.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-60"
          >
            {submitting ? "Menyimpan…" : "Simpan catatan"}
          </button>
        </div>
      </form>
    </section>
  );
}

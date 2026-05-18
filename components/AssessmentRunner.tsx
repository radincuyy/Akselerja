"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitAssessmentAttempt } from "@/lib/profile-actions";
import type { AssessmentQuestion } from "@/lib/types";

type Props = {
  slug: string;
  questions: AssessmentQuestion[];
  assessmentTitle: string;
};

type ResultState = {
  score: number;
  correct: number;
  total: number;
  level: 1 | 2 | 3;
};

export default function AssessmentRunner({
  slug,
  questions,
  assessmentTitle,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (questions.length === 0) {
    return (
      <p className="rounded-md border border-(--color-line) bg-(--color-tint) p-4 text-sm text-(--color-muted)">
        Soal untuk assessment ini sedang disiapkan. Cek kembali nanti.
      </p>
    );
  }

  if (result) {
    const level =
      result.level === 3 ? "Mahir" : result.level === 2 ? "Menengah" : "Dasar";
    return (
      <section
        aria-labelledby="result-heading"
        className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-8"
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
          Hasil
        </p>
        <h2
          id="result-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-(--color-ink)"
        >
          {assessmentTitle}
        </h2>
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-6xl font-semibold leading-none tabular-nums text-(--color-teal)">
            {result.score}
          </span>
          <span className="text-2xl text-(--color-muted)">%</span>
          <span className="ml-3 rounded-full bg-(--color-tint) px-3 py-1 text-sm font-medium text-(--color-ink)">
            Level: {level}
          </span>
        </div>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-(--color-ink)">
          Kamu menjawab {result.correct} dari {result.total} soal dengan benar.
          Skor ini sudah ditambahkan ke profilmu, dan match score lowonganmu
          akan diperbarui otomatis.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/app/assessment"
            className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
          >
            Lihat assessment lain
          </Link>
          <Link
            href="/app/lowongan"
            className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-5 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
          >
            Lihat lowongan terbaru
          </Link>
        </div>
      </section>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const correct = questions.reduce(
      (n, q) => (answers[q.id] === q.correctOptionId ? n + 1 : n),
      0,
    );
    startTransition(async () => {
      const res = await submitAssessmentAttempt({
        slug,
        total: questions.length,
        correct,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult({
        score: res.score,
        correct: res.correct,
        total: res.total,
        level: res.level,
      });
    });
  }

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {questions.map((q, i) => (
        <fieldset
          key={q.id}
          className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5 sm:p-6"
        >
          <legend className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
            Soal {i + 1} dari {questions.length}
          </legend>
          <p className="mt-3 text-base font-medium text-(--color-ink)">
            {q.prompt}
          </p>
          <div className="mt-4 space-y-2">
            {q.options.map((opt) => {
              const id = `${q.id}-${opt.id}`;
              const checked = answers[q.id] === opt.id;
              return (
                <label
                  key={opt.id}
                  htmlFor={id}
                  className={
                    checked
                      ? "flex cursor-pointer items-center gap-3 rounded-md border border-(--color-teal) bg-(--color-tint) px-4 py-2.5 text-sm text-(--color-ink)"
                      : "flex cursor-pointer items-center gap-3 rounded-md border border-(--color-line) bg-(--color-paper) px-4 py-2.5 text-sm text-(--color-ink) hover:border-(--color-ink)/40"
                  }
                >
                  <input
                    type="radio"
                    id={id}
                    name={q.id}
                    value={opt.id}
                    required
                    checked={checked}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                    }
                    className="h-4 w-4 accent-(--color-teal)"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {error ? (
        <p role="alert" className="text-sm text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-(--color-muted)">
          {Object.keys(answers).length} dari {questions.length} dijawab
        </p>
        <button
          type="submit"
          disabled={!allAnswered || pending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-(--color-teal) px-5 py-3 text-sm font-semibold text-(--color-paper-on-teal) transition-colors hover:bg-(--color-teal-deep) disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Kirim jawaban"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitCheckpointAttempt } from "@/lib/profile-actions";
import type { CheckpointQuestion } from "@/lib/checkpoint-generator";

type Props = {
  skillId: string;
  skillName: string;
  questions: CheckpointQuestion[];
};

type SubmitResult = {
  total: number;
  correct: number;
  passed: boolean;
  perQuestion: {
    questionId: string;
    correct: boolean;
    correctIndex: number;
    explanation: string;
  }[];
};

export default function CheckpointQuiz({
  skillId,
  skillName,
  questions,
}: Props) {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allAnswered = questions.every(
    (q) => typeof selections[q.id] === "number",
  );

  function handleSelect(questionId: string, optionIndex: number) {
    if (result) return;
    setSelections((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handleSubmit() {
    if (!allAnswered) return;
    setError(null);
    startTransition(async () => {
      const res = await submitCheckpointAttempt({
        skillId,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedIndex: selections[q.id],
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult({
        total: res.total,
        correct: res.correct,
        passed: res.passed,
        perQuestion: res.perQuestion,
      });
    });
  }

  function reset() {
    setSelections({});
    setResult(null);
    setError(null);
  }

  return (
    <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-(--color-ink)">
          Cek pemahaman
        </h2>
        <p className="text-xs text-(--color-muted)">
          10 soal pilihan ganda. Lulus minimal 7 dari 10 untuk menambah skill ke profil.
        </p>
      </div>

      <ol className="mt-6 space-y-6">
        {questions.map((q, qi) => {
          const selected = selections[q.id];
          const verdict = result?.perQuestion.find(
            (p) => p.questionId === q.id,
          );
          return (
            <li key={q.id} className="space-y-3">
              <p className="text-sm font-medium text-(--color-ink)">
                {qi + 1}. {q.prompt}
              </p>
              <div className="grid gap-2">
                {q.options.map((option, oi) => {
                  const isSelected = selected === oi;
                  const isCorrect = verdict?.correctIndex === oi;
                  const isWrong =
                    verdict && isSelected && !verdict.correct;

                  let stateClass =
                    "border-(--color-line) bg-(--color-paper) text-(--color-ink) hover:border-(--color-teal)";
                  if (verdict) {
                    if (isCorrect) {
                      stateClass =
                        "border-(--color-signal-green) bg-(--color-tint) text-(--color-signal-green)";
                    } else if (isWrong) {
                      stateClass =
                        "border-(--color-signal-clay) bg-(--color-tint) text-(--color-signal-clay)";
                    } else {
                      stateClass =
                        "border-(--color-line) bg-(--color-paper) text-(--color-muted)";
                    }
                  } else if (isSelected) {
                    stateClass =
                      "border-(--color-teal) bg-(--color-tint) text-(--color-ink)";
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => handleSelect(q.id, oi)}
                      disabled={Boolean(result)}
                      aria-pressed={isSelected}
                      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${stateClass}`}
                    >
                      <span className="font-semibold tabular-nums">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>
              {verdict ? (
                <p
                  className={`rounded-md p-3 text-xs leading-relaxed ${
                    verdict.correct
                      ? "bg-(--color-tint) text-(--color-signal-green)"
                      : "bg-(--color-tint) text-(--color-ink)"
                  }`}
                >
                  {verdict.correct ? "Benar. " : "Belum tepat. "}
                  {q.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="mt-5 text-sm text-(--color-signal-clay)">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 rounded-md border border-(--color-line) bg-(--color-tint) p-5">
          <p className="text-sm font-semibold text-(--color-ink)">
            {result.passed
              ? `Lulus. ${result.correct}/${result.total} jawaban benar.`
              : `Belum lulus. ${result.correct}/${result.total} jawaban benar.`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            {result.passed
              ? `Skill ${skillName} sudah ditambahkan ke profil. Match score di lowongan terkait akan ikut naik saat halaman dibuka ulang.`
              : `Skor minimum untuk menambah skill ke profil adalah 7 dari 10. Buka materi sekali lagi atau coba lagi setelah memperdalam pemahaman.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {result.passed ? (
              <Link
                href="/app/belajar"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
              >
                Kembali ke roadmap
              </Link>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
              >
                Coba lagi
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-(--color-muted)">
            {Object.keys(selections).length}/{questions.length} jawaban dipilih
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || pending}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-50"
          >
            {pending ? "Menilai..." : "Kumpulkan jawaban"}
          </button>
        </div>
      )}
    </section>
  );
}

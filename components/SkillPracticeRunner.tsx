"use client";

import { useEffect, useMemo, useState } from "react";
import type { PracticeRubricCriterion, PracticeTask } from "@/lib/types";

type Props = {
  task: PracticeTask;
  skillName: string;
};

type CriterionResult = {
  criterion: PracticeRubricCriterion;
  score: number;
  hits: number;
};

function typeLabel(type: PracticeTask["type"]): string {
  if (type === "roleplay") return "Roleplay";
  if (type === "document-review") return "Review dokumen";
  if (type === "design-brief") return "Design brief";
  return "Simulasi kasus";
}

function scoreCriterion(answer: string, criterion: PracticeRubricCriterion) {
  const normalized = answer.toLowerCase();
  const hits = criterion.signals.filter((signal) =>
    normalized.includes(signal.toLowerCase()),
  ).length;
  const lengthBonus = Math.min(12, Math.floor(answer.trim().length / 180) * 4);
  const base = hits === 0 ? 38 : 58 + hits * 9;
  const score = Math.max(30, Math.min(96, base + lengthBonus));
  return { score, hits };
}

function gradeAnswer(task: PracticeTask, answer: string): CriterionResult[] {
  return task.rubric.map((criterion) => {
    const { score, hits } = scoreCriterion(answer, criterion);
    return { criterion, score, hits };
  });
}

function levelFromScore(score: number) {
  if (score >= 85) return "Siap divalidasi";
  if (score >= 72) return "Hampir siap";
  if (score >= 58) return "Perlu latihan ulang";
  return "Butuh fondasi";
}

export default function SkillPracticeRunner({ task, skillName }: Props) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(task.estimatedMinutes);
  const [secondsLeft, setSecondsLeft] = useState(task.estimatedMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const results = useMemo(
    () => (submitted ? gradeAnswer(task, answer) : []),
    [answer, submitted, task],
  );

  const totalScore = results.length
    ? Math.round(
        results.reduce(
          (sum, result) => sum + result.score * (result.criterion.weight / 100),
          0,
        ),
      )
    : 0;
  const strongest = [...results].sort((a, b) => b.score - a.score)[0];
  const weakest = [...results].sort((a, b) => a.score - b.score)[0];

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerRunning]);

  function resetTimer(nextMinutes = durationMinutes) {
    setTimerRunning(false);
    setDurationMinutes(nextMinutes);
    setSecondsLeft(nextMinutes * 60);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
      <div>
        <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-(--color-tint) px-3 py-1 text-xs font-medium text-(--color-teal)">
              {typeLabel(task.type)}
            </span>
            <span className="rounded-full border border-(--color-line) px-3 py-1 text-xs text-(--color-muted)">
              {skillName}
            </span>
          </div>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
            Skenario
          </h2>
          <p className="mt-3 text-base leading-relaxed text-(--color-ink)">
            {task.scenario}
          </p>

          <h2 className="mt-7 text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
            Tugas
          </h2>
          <ol className="mt-3 space-y-2">
            {task.instructions.map((instruction, i) => (
              <li
                key={instruction}
                className="flex gap-3 text-sm leading-relaxed text-(--color-ink)"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-xs font-semibold text-(--color-teal)">
                  {i + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </section>

        <form
          onSubmit={submit}
          className="mt-6 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7"
        >
          <label
            htmlFor="practice-answer"
            className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
          >
            Jawaban kandidat
          </label>
          <textarea
            id="practice-answer"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (submitted) setSubmitted(false);
            }}
            rows={9}
            placeholder="Tulis langkah kerja, keputusan, dan alasanmu di sini."
            className="mt-3 w-full resize-none rounded-md border border-(--color-line) bg-(--color-paper) px-4 py-3 text-base leading-relaxed text-(--color-ink) outline-none placeholder:text-(--color-muted) focus:border-(--color-teal)"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-(--color-muted)">
              {answer.trim().length} karakter. Feedback membaca sinyal pada
              rubrik.
            </p>
            <button
              type="submit"
              disabled={!answer.trim()}
              className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-50"
            >
              Nilai dengan AI
            </button>
          </div>
        </form>

        {submitted ? (
          <section className="mt-6 rounded-lg border border-(--color-teal) bg-(--color-teal-soft) p-6 sm:p-7">
            <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal-deep)">
              Feedback AI berbasis rubrik
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-6xl font-semibold leading-none tabular-nums text-(--color-teal)">
                {totalScore}
              </span>
              <span className="pb-2 text-xl text-(--color-muted)">/100</span>
              <span className="mb-2 rounded-full bg-(--color-paper) px-3 py-1 text-sm font-medium text-(--color-ink)">
                {levelFromScore(totalScore)}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FeedbackBlock
                title="Yang sudah kuat"
                body={
                  strongest
                    ? `${strongest.criterion.name}: jawabanmu menangkap ${strongest.hits} sinyal penting dari rubrik.`
                    : "Jawaban sudah masuk dan siap dinilai."
                }
              />
              <FeedbackBlock
                title="Perlu ditajamkan"
                body={
                  weakest
                    ? `${weakest.criterion.name}: tambahkan bukti yang lebih eksplisit soal ${weakest.criterion.description.toLowerCase()}`
                    : "Tambahkan langkah kerja yang lebih spesifik."
                }
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-(--color-line) bg-(--color-paper)">
              <table className="w-full text-left text-sm">
                <thead className="bg-(--color-tint) text-xs uppercase tracking-wider text-(--color-muted)">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Rubrik
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Bobot
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Skor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-line)">
                  {results.map((result) => (
                    <tr key={result.criterion.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-(--color-ink)">
                          {result.criterion.name}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-(--color-muted)">
                          {result.criterion.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-(--color-muted)">
                        {result.criterion.weight}%
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-(--color-ink)">
                        {result.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
        <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
            Timer latihan
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Atur durasi sesuai waktu fokusmu. Timer ini hanya membantu ritme,
            bukan batas pengerjaan.
          </p>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold tabular-nums leading-none text-(--color-teal)">
                {formatTimer(secondsLeft)}
              </p>
              <p className="mt-1 text-xs text-(--color-muted)">
                {timerRunning ? "Sedang berjalan" : "Belum dimulai"}
              </p>
            </div>
            <label className="w-24 text-xs font-medium text-(--color-muted)">
              Menit
              <input
                type="number"
                min={5}
                max={120}
                step={5}
                value={durationMinutes}
                onChange={(e) => {
                  const next = Math.min(
                    120,
                    Math.max(5, Number(e.target.value) || 5),
                  );
                  resetTimer(next);
                }}
                className="mt-1 w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink)"
              />
            </label>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning((value) => !value)}
              disabled={secondsLeft === 0}
              className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-50"
            >
              {timerRunning ? "Pause" : "Mulai"}
            </button>
            <button
              type="button"
              onClick={() => resetTimer()}
              className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
            Bukti yang dicari
          </h2>
          <ul className="mt-4 space-y-2">
            {task.expectedEvidence.map((evidence) => (
              <li
                key={evidence}
                className="flex gap-2 text-sm leading-relaxed text-(--color-ink)"
              >
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-teal)"
                />
                <span>{evidence}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function FeedbackBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md bg-(--color-paper) p-4">
      <p className="text-sm font-semibold text-(--color-ink)">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
        {body}
      </p>
    </div>
  );
}

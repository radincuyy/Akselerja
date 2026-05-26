"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { submitPracticeAttempt } from "@/lib/profile-actions";
import {
  calculatePracticeScore,
  gradePracticeAnswer,
  levelFromPracticeScore,
} from "@/lib/practice-grading";
import type { PracticeTask } from "@/lib/types";

type Props = {
  task: PracticeTask;
  skillName: string;
  initialAttempt?: {
    answer: string;
    score: number;
    passed: boolean;
    completedAt: string;
  } | null;
};

function typeLabel(type: PracticeTask["type"]): string {
  if (type === "roleplay") return "Roleplay";
  if (type === "document-review") return "Review dokumen";
  if (type === "design-brief") return "Design brief";
  return "Simulasi kasus";
}

export default function SkillPracticeRunner({
  task,
  skillName,
  initialAttempt,
}: Props) {
  const [answer, setAnswer] = useState(initialAttempt?.answer ?? "");
  const [submitted, setSubmitted] = useState(Boolean(initialAttempt));
  const [completedAt, setCompletedAt] = useState(
    initialAttempt?.completedAt ?? "",
  );
  const [durationMinutes, setDurationMinutes] = useState(task.estimatedMinutes);
  const [secondsLeft, setSecondsLeft] = useState(task.estimatedMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const results = useMemo(
    () => (submitted ? gradePracticeAnswer(task, answer) : []),
    [answer, submitted, task],
  );

  const totalScore = calculatePracticeScore(results);
  const strongest = [...results].sort((a, b) => b.score - a.score)[0];
  const weakest = [...results].sort((a, b) => a.score - b.score)[0];
  const timerExpired = secondsLeft === 0;
  const isPassed = totalScore >= 72;

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
    if (!answer.trim() || timerExpired) return;
    const nextAnswer = answer.trim();
    setError(null);
    setTimerRunning(false);

    startTransition(async () => {
      const res = await submitPracticeAttempt({
        slug: task.slug,
        answer: nextAnswer,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }

      setAnswer(nextAnswer);
      setCompletedAt(res.completedAt);
      setSubmitted(true);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
      <div className="order-2 lg:order-1">
        <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-(--color-tint) px-3 py-1 text-xs font-medium text-(--color-teal)">
              {typeLabel(task.type)}
            </span>
            <span className="rounded-full border border-(--color-line) px-3 py-1 text-xs text-(--color-muted)">
              {skillName}
            </span>
          </div>

          <h2 className="mt-6 text-sm font-medium text-(--color-muted)">
            Skenario
          </h2>
          <p className="mt-3 text-base leading-relaxed text-(--color-ink)">
            {task.scenario}
          </p>

          <h2 className="mt-7 text-sm font-medium text-(--color-muted)">
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
            className="text-sm font-medium text-(--color-muted)"
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
              {timerExpired
                ? "Waktu habis. Reset timer untuk mengirim jawaban."
                : `${answer.trim().length} karakter. Feedback membaca sinyal pada rubrik.`}
            </p>
            <button
              type="submit"
              disabled={!answer.trim() || timerExpired || pending}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-50"
            >
              {pending
                ? "Menyimpan..."
                : timerExpired
                  ? "Waktu habis"
                  : "Nilai jawaban"}
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-(--color-signal-clay)">
              {error}
            </p>
          ) : null}
        </form>

        {submitted ? (
          <section className="mt-6 rounded-lg border border-(--color-teal) bg-(--color-teal-soft) p-6 sm:p-7">
            <p className="text-sm font-medium text-(--color-teal-deep)">
              Feedback Rubrik
            </p>
            {completedAt ? (
              <p className="mt-1 text-xs text-(--color-muted)">
                Tersimpan {formatCompletedAt(completedAt)}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-6xl font-semibold leading-none tabular-nums text-(--color-teal)">
                {totalScore}
              </span>
              <span className="pb-2 text-xl text-(--color-muted)">/100</span>
              <span className="mb-2 rounded-full bg-(--color-paper) px-3 py-1 text-sm font-medium text-(--color-ink)">
                {levelFromPracticeScore(totalScore)}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-(--color-ink)">
              {isPassed
                ? `Skill ${skillName} sudah ditambahkan ke profil jika sebelumnya belum ada. Match score akan diperbarui saat halaman belajar atau lowongan dibuka ulang.`
                : "Jawabanmu sudah tersimpan, tapi skor rubrik belum cukup untuk menambahkan skill ke profil. Edit jawaban untuk menaikkan bukti skill."}
            </p>

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

            <div className="mt-6 flex flex-col gap-3 border-t border-(--color-line) pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-(--color-muted)">
                Latihan sudah dinilai. Kamu bisa kembali ke halaman belajar
                atau perbaiki jawaban untuk mencoba lagi.
              </p>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
                >
                  Edit jawaban
                </button>
                <Link
                  href="/app/belajar"
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                >
                  Selesai dan kembali
                </Link>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="order-1 space-y-5 lg:sticky lg:top-32 lg:order-2 lg:self-start">
        <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
          <h2 className="text-sm font-medium text-(--color-muted)">
            Timer latihan
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Atur durasi sesuai waktu fokusmu. Timer ini hanya membantu ritme,
            bukan batas pengerjaan.
          </p>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p
                className={`text-5xl font-semibold tabular-nums leading-none ${
                  timerExpired
                    ? "text-(--color-signal-clay)"
                    : "text-(--color-teal)"
                }`}
              >
                {formatTimer(secondsLeft)}
              </p>
              <p
                className={`mt-1 text-xs ${
                  timerExpired
                    ? "text-(--color-signal-clay)"
                    : "text-(--color-muted)"
                }`}
              >
                {timerExpired
                  ? "Waktu habis"
                  : timerRunning
                    ? "Sedang berjalan"
                    : "Belum dimulai"}
              </p>
            </div>
            <label className="w-24 text-xs font-medium text-(--color-muted)">
              Menit
              <input
                type="number"
                min={1}
                max={120}
                step={1}
                value={durationMinutes}
                onChange={(e) => {
                  const next = Math.min(
                    120,
                    Math.max(1, Number(e.target.value) || 1),
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
              disabled={timerExpired}
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
          <h2 className="text-sm font-medium text-(--color-muted)">
            Bukti yang dicari
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Ini sinyal bukti yang dicari dari jawabanmu. Rubrik lengkap dengan
            bobot dan skor akan muncul setelah jawaban dinilai.
          </p>
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

function formatCompletedAt(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "baru saja";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

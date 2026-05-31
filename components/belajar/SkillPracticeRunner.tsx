"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { submitPracticeAttempt } from "@/lib/profile/profile-actions";
import {
  calculatePracticeScore,
  gradePracticeAnswer,
  levelFromPracticeScore,
} from "@/lib/learning/practice-grading";
import type { PracticeTask } from "@/lib/shared/types";
import type { ClientCheckpointQuestion } from "@/lib/learning/checkpoint-generator";
import type { YouTubeVideo } from "@/lib/learning/youtube-search";

type GradingResult = {
  score: number;
  feedback: string;
  gradedBy: "ai" | "keyword";
  perCriterion: { id: string; name: string; score: number; feedback: string }[];
  mcCorrect?: number;
  mcTotal?: number;
};

type Props = {
  task: PracticeTask;
  skillName: string;
  initialAttempt?: {
    answer: string;
    score: number;
    passed: boolean;
    completedAt: string;
    feedback?: string;
    gradedBy?: "ai" | "keyword";
    perCriterion?: {
      id: string;
      name: string;
      score: number;
      feedback: string;
    }[];
    mcCorrect?: number;
    mcTotal?: number;
  } | null;
  mcQuestions?: ClientCheckpointQuestion[];
  mcGeneratedBy?: "ai" | "fallback";
  videos?: YouTubeVideo[];
  target?: string;
};

function typeLabel(type: PracticeTask["type"]): string {
  if (type === "roleplay") return "Roleplay";
  if (type === "document-review") return "Review dokumen";
  if (type === "design-brief") return "Design brief";
  return "Simulasi kasus";
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}:${String(s).padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SkillPracticeRunner({
  task,
  skillName,
  initialAttempt,
  mcQuestions = [],
  mcGeneratedBy,
  videos = [],
  target,
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
  const [mcSelections, setMcSelections] = useState<Record<string, number>>({});
  const [serverResult, setServerResult] = useState<GradingResult | null>(
    initialAttempt
      ? {
          score: initialAttempt.score,
          feedback: initialAttempt.feedback ?? "",
          gradedBy: initialAttempt.gradedBy ?? "keyword",
          perCriterion: initialAttempt.perCriterion ?? [],
          mcCorrect: initialAttempt.mcCorrect,
          mcTotal: initialAttempt.mcTotal,
        }
      : null,
  );

  const localResults = useMemo(
    () => (submitted ? gradePracticeAnswer(task, answer) : []),
    [answer, submitted, task],
  );

  const criterionRows =
    serverResult && serverResult.perCriterion.length > 0
      ? serverResult.perCriterion.map((c) => {
          const def = task.rubric.find((r) => r.id === c.id);
          return {
            id: c.id,
            name: c.name || def?.name || c.id,
            description: def?.description ?? "",
            weight: def?.weight ?? 0,
            score: c.score,
            feedback: c.feedback,
          };
        })
      : localResults.map((r) => ({
          id: r.criterion.id,
          name: r.criterion.name,
          description: r.criterion.description,
          weight: r.criterion.weight,
          score: r.score,
          feedback: "",
        }));

  const totalScore =
    serverResult?.score ??
    (submitted ? calculatePracticeScore(localResults) : 0);
  const strongest = [...criterionRows].sort((a, b) => b.score - a.score)[0];
  const weakest = [...criterionRows].sort((a, b) => a.score - b.score)[0];
  const timerExpired = secondsLeft === 0;
  const isPassed = totalScore >= 80;
  const allMcAnswered = mcQuestions.every(
    (q) => typeof mcSelections[q.id] === "number",
  );
  const mcRemaining = mcQuestions.length - Object.keys(mcSelections).length;

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
    if (mcQuestions.length > 0 && !allMcAnswered) {
      setError("Jawab semua soal pilihan ganda dulu sebelum mengirim.");
      return;
    }
    const nextAnswer = answer.trim();
    setError(null);
    setTimerRunning(false);

    const mcAnswers = mcQuestions.map((q) => ({
      questionId: q.id,
      selectedIndex: mcSelections[q.id] ?? -1,
    }));

    startTransition(async () => {
      const res = await submitPracticeAttempt({
        slug: task.slug,
        answer: nextAnswer,
        mcAnswers: mcAnswers.length > 0 ? mcAnswers : undefined,
        target,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }

      setAnswer(nextAnswer);
      setCompletedAt(res.completedAt);
      setServerResult({
        score: res.score,
        feedback: res.feedback,
        gradedBy: res.gradedBy,
        perCriterion: res.perCriterion,
        mcCorrect: res.mcCorrect,
        mcTotal: res.mcTotal,
      });
      setSubmitted(true);
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
      <div className="order-2 lg:order-1">
        {videos.length > 0 ? (
          <section className="mb-6 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
            <h2 className="text-sm font-medium uppercase tracking-wider text-(--color-muted)">
              Materi video
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
              Tonton dulu untuk membangun konteks, lalu kerjakan latihan di bawah.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {videos.map((video) => (
                <li key={video.videoId}>
                  <a
                    href={`https://youtu.be/${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Tonton ${video.title} dari ${video.channelTitle} di YouTube (tab baru)`}
                    className="group block rounded-md border border-(--color-line) bg-(--color-paper) hover:border-(--color-teal)"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-md bg-(--color-tint)">
                      <Image
                        src={video.thumbnailUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        unoptimized
                        className="object-cover"
                      />
                      {video.durationSeconds ? (
                        <span className="absolute bottom-2 right-2 rounded bg-(--color-ink) px-1.5 py-0.5 text-[11px] font-medium text-(--color-paper) opacity-90">
                          {formatDuration(video.durationSeconds)}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-(--color-ink) group-hover:text-(--color-teal)">
                        {video.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-(--color-muted)">
                        {video.channelTitle}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {mcQuestions.length > 0 && !submitted ? (
          <section className="mt-6 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
            <h2 className="text-sm font-medium uppercase tracking-wider text-(--color-muted)">
              Warmup pemahaman
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
              {mcQuestions.length} soal pilihan ganda untuk pemanasan. Skor warmup
              menyumbang separuh dari nilai akhir.
            </p>
            {mcGeneratedBy === "fallback" ? (
              <p className="mt-3 rounded-md border border-(--color-line) bg-(--color-tint) p-3 text-xs leading-relaxed text-(--color-muted)">
                Soal ini dibuat dari template umum karena penilai AI sedang
                sibuk. Tetap berguna untuk latihan, tapi belum spesifik untuk
                skill ini.
              </p>
            ) : null}
            <ol className="mt-5 space-y-5">
              {mcQuestions.map((q, qi) => {
                const selected = mcSelections[q.id];
                return (
                  <li key={q.id} className="space-y-2">
                    <p className="text-sm font-medium text-(--color-ink)">
                      {qi + 1}. {q.prompt}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((option, oi) => {
                        const isSelected = selected === oi;
                        return (
                          <button
                            key={oi}
                            type="button"
                            onClick={() =>
                              setMcSelections((prev) => ({ ...prev, [q.id]: oi }))
                            }
                            aria-pressed={isSelected}
                            className={`flex items-start gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-colors ${
                              isSelected
                                ? "border-(--color-teal) bg-(--color-tint) text-(--color-ink)"
                                : "border-(--color-line) bg-(--color-paper) text-(--color-ink) hover:border-(--color-teal)"
                            }`}
                          >
                            <span className="font-semibold tabular-nums">
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            <span className="flex-1">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-(--color-muted)">
              {Object.keys(mcSelections).length}/{mcQuestions.length} jawaban
              dipilih.
            </p>
          </section>
        ) : null}

        <section className="mt-6 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-(--color-tint) px-3 py-1 text-xs font-medium text-(--color-teal)">
              {typeLabel(task.type)}
            </span>
            <span className="rounded-full border border-(--color-line) px-3 py-1 text-xs text-(--color-muted)">
              {skillName}
            </span>
          </div>

          <h2 className="mt-5 text-lg font-semibold tracking-tight text-(--color-ink)">
            {task.title}
          </h2>

          <h3 className="mt-6 text-sm font-medium text-(--color-muted)">
            Skenario
          </h3>
          <p className="mt-3 text-base leading-relaxed text-(--color-ink)">
            {task.scenario}
          </p>

          <h3 className="mt-7 text-sm font-medium text-(--color-muted)">
            Tugas
          </h3>
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
              {mcQuestions.length > 0 && !allMcAnswered
                ? `Masih ada ${mcRemaining} soal pilihan ganda yang belum dijawab.`
                : `${answer.trim().length} karakter. Feedback membaca sinyal pada rubrik.`}
            </p>
            <button
              type="submit"
              disabled={
                !answer.trim() ||
                pending ||
                (mcQuestions.length > 0 && !allMcAnswered)
              }
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : "Nilai jawaban"}
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

            {serverResult?.gradedBy === "keyword" ? (
              <p className="mt-4 rounded-md border border-(--color-line) bg-(--color-tint) p-3 text-xs leading-relaxed text-(--color-muted)">
                Penilaian AI sedang tidak tersedia, jadi skor ini dihitung
                dengan metode dasar berbasis kata kunci. Hasilnya tetap
                tersimpan, tapi bisa kurang akurat. Coba nilai ulang nanti untuk
                feedback yang lebih dalam.
              </p>
            ) : null}

            {serverResult?.feedback ? (
              <div className="mt-4 rounded-md border border-(--color-line) bg-(--color-paper) p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                  {serverResult.gradedBy === "ai"
                    ? "Catatan dari AI evaluator"
                    : "Catatan otomatis"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-(--color-ink)">
                  {serverResult.feedback}
                </p>
                {typeof serverResult.mcCorrect === "number" &&
                typeof serverResult.mcTotal === "number" &&
                serverResult.mcTotal > 0 ? (
                  <p className="mt-3 text-xs text-(--color-muted)">
                    Warmup pilihan ganda: {serverResult.mcCorrect}/
                    {serverResult.mcTotal} benar.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FeedbackBlock
                title="Yang sudah kuat"
                body={
                  strongest
                    ? `${strongest.name}: ${strongest.feedback || `skor ${strongest.score}/100 pada kriteria ini.`}`
                    : "Jawaban sudah masuk dan siap dinilai."
                }
              />
              <FeedbackBlock
                title="Perlu ditajamkan"
                body={
                  weakest
                    ? `${weakest.name}: ${weakest.feedback || (weakest.description ? `tambahkan bukti yang lebih eksplisit soal ${weakest.description.toLowerCase()}` : "tambahkan bukti yang lebih konkret.")}`
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
                  {criterionRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-(--color-ink)">
                          {row.name}
                        </p>
                        {row.description ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-(--color-muted)">
                            {row.description}
                          </p>
                        ) : null}
                        {row.feedback ? (
                          <p className="mt-1.5 text-xs leading-relaxed text-(--color-teal-deep)">
                            {row.feedback}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-(--color-muted)">
                        {row.weight ? `${row.weight}%` : "-"}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-(--color-ink)">
                        {row.score}
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

        {task.sourceLabel.toLowerCase().includes("skkni") &&
        task.sourceNotes.length > 0 ? (
          <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
            <h2 className="text-sm font-medium text-(--color-muted)">
              {task.sourceLabel}
            </h2>
            <ul className="mt-4 space-y-2">
              {task.sourceNotes.map((note) => (
                <li
                  key={note}
                  className="flex gap-2 text-xs leading-relaxed text-(--color-muted)"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-teal)"
                  />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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

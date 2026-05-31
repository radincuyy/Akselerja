import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import LinkPendingIndicator from "@/components/LinkPendingIndicator";
import {
  listPracticeAttemptsForUser,
  type PracticeAttempt,
} from "@/lib/learning/attempts-store";
import { calcMatch } from "@/lib/jobs/match";
import { rankCandidateJobs } from "@/lib/jobs/recommendations";
import { readCachedGapExplanations } from "@/lib/learning/gap-explain";
import { getCurrentCandidate } from "@/lib/profile/current-candidate";
import {
  getGeneratedPracticeTask,
  type PracticeJobContext,
} from "@/lib/learning/practice-generation";
import { listPracticeTasksAsync } from "@/lib/learning/practice-store";
import { getJobByIdAsync } from "@/lib/jobs/jobs-store";
import { skillById } from "@/lib/learning/skills";
import { scoreBandLabel } from "@/lib/shared/format";
import type { Job, PracticeTask } from "@/lib/shared/types";

type SearchParams = Promise<{
  target?: string;
  roadmapPage?: string;
}>;

const PRACTICE_PREGEN_LIMIT = 2;
const ROADMAP_PAGE_SIZE = 3;

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function belajarHref({
  target,
  roadmapPage,
}: {
  target?: string;
  roadmapPage?: number;
}) {
  const params = new URLSearchParams();
  if (target) params.set("target", target);
  if (roadmapPage && roadmapPage > 1) {
    params.set("roadmapPage", String(roadmapPage));
  }
  const qs = params.toString();
  return qs ? `/app/belajar?${qs}` : "/app/belajar";
}

type RoadmapStep = {
  label: string;
  title: string;
  body: string;
  evidence: string;
  href?: string;
  action: string;
  completed?: boolean;
  passed?: boolean;
  score?: number;
  disabledReason?: string;
  skillId?: string;
  skillLabel?: string;
  estimatedMinutes?: number;
  isFinal?: boolean;
  locked?: boolean;
  allClear?: boolean;
};

function skillName(skillId: string, fallback?: string): string {
  return fallback ?? skillById[skillId]?.name ?? skillId;
}

async function generatePriorityPracticeTasks(
  skillIds: string[],
  jobContext?: PracticeJobContext,
): Promise<PracticeTask[]> {
  const uniqueSkillIds = Array.from(new Set(skillIds)).slice(
    0,
    PRACTICE_PREGEN_LIMIT,
  );
  const tasks = await Promise.all(
    uniqueSkillIds.map((skillId) =>
      getGeneratedPracticeTask(skillId, jobContext),
    ),
  );
  return tasks.filter((task): task is PracticeTask => Boolean(task));
}

function buildRoadmap(
  gaps: { skillId: string; name: string }[],
  targetJob: Job,
  explanations: Map<string, string>,
  practiceTasks: PracticeTask[],
  practiceAttempts: PracticeAttempt[],
): RoadmapStep[] {
  const latestAttemptByTaskId = new Map<string, PracticeAttempt>();
  for (const attempt of practiceAttempts) {
    if (!latestAttemptByTaskId.has(attempt.taskId)) {
      latestAttemptByTaskId.set(attempt.taskId, attempt);
    }
  }

  const targetSkillIds = new Set(
    targetJob.requirements.map((requirement) => requirement.skillId),
  );
  const targetSuffix = `?target=${encodeURIComponent(targetJob.id)}`;
  const completedTasks = practiceTasks.filter(
    (task) =>
      targetSkillIds.has(task.skillId) && latestAttemptByTaskId.has(task.id),
  );
  const completedSkillIds = new Set(
    completedTasks.map((task) => task.skillId),
  );
  const openGaps = gaps.filter((gap) => !completedSkillIds.has(gap.skillId));

  if (gaps.length === 0 && completedTasks.length === 0) {
    return [
      {
        label: "Step 1",
        title: "Profilmu sudah cocok",
        body: "Semua skill yang diminta lowongan ini sudah ada di profilmu. Buka detail lowongan dan kirim lamaran lewat Glints.",
        evidence:
          "Bisa menjelaskan dua pengalaman paling relevan dan satu hasil terukur.",
        href: `/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`,
        action: "Lihat lowongan",
        isFinal: true,
        allClear: true,
      },
    ];
  }

  const labels: string[] = [];

  const completedSteps: RoadmapStep[] = completedTasks
    .map((task, idx) => {
    const attempt = latestAttemptByTaskId.get(task.id);
    const name = skillName(task.skillId);
    return {
      label: labels[idx] ?? `Step ${idx + 1}`,
      title: `Tutup gap ${name}`,
      body: attempt?.passed
        ? `Latihan ${task.title} sudah selesai dan skill ini sudah menjadi bukti di profilmu.`
        : `Jawaban terakhir untuk ${task.title} sudah tersimpan. Buka lagi untuk melihat feedback dan memperbaiki jawaban.`,
      evidence: attempt
        ? `${task.title} · skor ${attempt.score}/100.`
        : task.title,
      action: "Selesai",
      href: `/app/belajar/${task.slug}${targetSuffix}`,
      completed: true,
      passed: attempt?.passed,
      score: attempt?.score,
      skillId: task.skillId,
      skillLabel: name,
    };
  });

  const gapSteps: RoadmapStep[] = openGaps
    .map((gap, offset) => {
      const idx = completedSteps.length + offset;
      const name = skillName(gap.skillId, gap.name);
      const practice = practiceTasks.find(
        (task) => task.skillId === gap.skillId,
      );
      const ragBody = explanations.get(gap.skillId);

      const fallbackBody = `Tonton materi video, kerjakan pilihan ganda, lalu tulis jawaban kasus untuk ${name}. Hasilnya jadi bukti skill ini bisa ditambahkan ke profil setelah skornya cukup.`;
      return {
        label: labels[idx] ?? `Step ${idx + 1}`,
        title: `Pelajari ${name}`,
        body: practice?.scenario ?? ragBody ?? fallbackBody,
        evidence:
          practice?.expectedEvidence?.[0] ??
          `Bisa menjelaskan minimal satu kasus konkret dari ${name} dan apa hasilnya.`,
        action: "Mulai belajar",
        href: practice
          ? `/app/belajar/${practice.slug}${targetSuffix}`
          : `/app/belajar/latihan-praktik-${gap.skillId}${targetSuffix}`,
        skillId: gap.skillId,
        skillLabel: name,
        estimatedMinutes: practice?.estimatedMinutes,
      };
    });

  const hasOpenGaps = openGaps.length > 0;
  const steps: RoadmapStep[] = [...completedSteps, ...gapSteps];

  steps.push({
    label: `Step ${steps.length + 1}`,
    title: "Update profil dan lamar",
    body: hasOpenGaps
      ? "Selesaikan langkah di atas dulu. Setelah skill kamu lengkap, balik ke sini untuk update profil dan lamar."
      : "Hasil belajar sudah jadi bukti kesiapan kerja. Update profil supaya match score-nya ikut naik, lalu lamar.",
    evidence:
      "Profil punya skill baru, dan kamu siap menjelaskan satu hal konkret untuk tiap skill.",
    href: hasOpenGaps
      ? undefined
      : `/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`,
    action: "Lihat lowongan",
    isFinal: true,
    locked: hasOpenGaps,
    disabledReason: hasOpenGaps
      ? "Tutup skill gap di atas dulu untuk membuka langkah ini."
      : undefined,
  });

  return steps;
}

function describeProgress(score: number): string {
  if (score >= 80) {
    return "Kamu sangat cocok untuk posisi ini. Roadmap di bawah membantu memperdalam beberapa hal yang masih bisa diperbaiki.";
  }
  if (score >= 60) {
    return "Posisi ini cukup cocok denganmu. Tutup beberapa skill di bawah supaya peluangmu makin besar.";
  }
  if (score >= 40) {
    return "Posisi ini bisa kamu kejar, tapi butuh waktu di skill prioritas dulu, atau bandingkan target lain dulu.";
  }
  return "Profilmu masih jauh dari posisi ini. Pertimbangkan target lain dulu, atau mulai dari skill paling dasar.";
}

export default async function BelajarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { target, roadmapPage } = await searchParams;
  const { user, profile: me } = await getCurrentCandidate();

  const [{ ranked }, basePracticeTasks, practiceAttempts] = await Promise.all([
    rankCandidateJobs(me, {
      top: 12,
      fallbackOnEmpty: true,
      filterPositiveScore: true,
    }),
    listPracticeTasksAsync(),
    listPracticeAttemptsForUser(user.id),
  ]);

  if (ranked.length === 0) {
    return <NoJobsState />;
  }

  if (!target) {
    return (
      <TargetPicker
        candidates={ranked.slice(0, 10).map((r) => ({
          job: r.job,
          score: r.score,
          missingCount: r.breakdown.filter((b) => b.state !== "match").length,
          totalSkills: r.breakdown.length,
        }))}
      />
    );
  }

  const overrideJob = ranked.find((r) => r.job.id === target);
  let top: { job: typeof ranked[number]["job"]; score: number; breakdown: typeof ranked[number]["breakdown"]; dimensions: typeof ranked[number]["dimensions"] };
  if (overrideJob) {
    top = overrideJob;
  } else {
    const job = await getJobByIdAsync(target);
    if (!job) {
      return (
        <TargetPicker
          candidates={ranked.slice(0, 10).map((r) => ({
            job: r.job,
            score: r.score,
            missingCount: r.breakdown.filter((b) => b.state !== "match").length,
            totalSkills: r.breakdown.length,
          }))}
          notice="Lowongan target tidak ditemukan. Pilih lowongan lain di bawah."
        />
      );
    }
    const match = calcMatch(me, job);
    top = {
      job,
      score: match.score,
      breakdown: match.breakdown,
      dimensions: match.dimensions,
    };
  }
  const targetJob = top.job;
  const score = top.score;
  const breakdown = top.breakdown;
  const dimensions = top.dimensions;
  const gaps = breakdown.filter((b) => b.state !== "match");
  const matched = breakdown.filter((b) => b.state === "match");
  const roadmapGapIds = new Set(gaps.map((g) => g.skillId));

  const priorityPracticeSkillIds = gaps
    .slice(0, PRACTICE_PREGEN_LIMIT)
    .map((gap) => gap.skillId);
  const practiceJobContext: PracticeJobContext = {
    jobId: targetJob.id,
    jobTitle: targetJob.title,
    jobCompany: targetJob.company,
  };
  const [explanations, generatedPracticeTasks] = await Promise.all([
    readCachedGapExplanations({
        job: targetJob,
        gaps: gaps.map((g) => ({ skillId: g.skillId, name: g.name })),
        candidateSkillIds: me.skills.map((s) => s.skillId),
        limit: 4,
      }),
    generatePriorityPracticeTasks(priorityPracticeSkillIds, practiceJobContext),
  ]);
  const practiceTasks = [...generatedPracticeTasks, ...basePracticeTasks];
  const roadmap = buildRoadmap(
    gaps,
    targetJob,
    explanations,
    practiceTasks,
    practiceAttempts,
  );
  const roadmapTotalPages = Math.max(
    1,
    Math.ceil(roadmap.length / ROADMAP_PAGE_SIZE),
  );
  const currentRoadmapPage = Math.min(
    parsePage(roadmapPage),
    roadmapTotalPages,
  );
  const roadmapStart = (currentRoadmapPage - 1) * ROADMAP_PAGE_SIZE;
  const pagedRoadmap = roadmap.slice(
    roadmapStart,
    roadmapStart + ROADMAP_PAGE_SIZE,
  );

  const hasGaps = gaps.length > 0;
  const focusGap = gaps[0];
  const focusPractice = focusGap
    ? practiceTasks.find((task) => task.skillId === focusGap.skillId)
    : null;
  const focusHref = focusPractice
    ? `/app/belajar/${focusPractice.slug}?target=${encodeURIComponent(targetJob.id)}`
    : focusGap
      ? `/app/belajar/latihan-praktik-${focusGap.skillId}?target=${encodeURIComponent(targetJob.id)}`
      : null;
  const targetJobHref = `/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`;

  const description = `Roadmap dari requirement spesifik ${targetJob.company}, disesuaikan dengan profilmu.`;

  return (
    <>
      <PageHeader
        eyebrow="Belajar"
        title={
          hasGaps
            ? `Roadmap menuju ${targetJob.title}`
            : `Kamu sudah cocok untuk ${targetJob.title}`
        }
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            {focusGap && focusHref ? (
              <>
                <Link
                  href={targetJobHref}
                  className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
                >
                  Lihat lowongan
                </Link>
                <Link
                  href={focusHref}
                  className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                >
                  Mulai dari {skillName(focusGap.skillId, focusGap.name)}
                </Link>
              </>
            ) : (
              <Link
                href={targetJobHref}
                className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
              >
                Lamar di Glints
              </Link>
            )}
          </div>
        }
      />

      <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-(--color-muted)">
            Target kerja saat ini
          </p>
          <Link
            href="/app/belajar"
            className="text-xs text-(--color-muted) hover:text-(--color-teal)"
          >
            Ganti target kerja
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              {targetJob.title}
            </h2>
            <p className="mt-1 text-sm text-(--color-muted)">
              {targetJob.company} · {targetJob.location}
            </p>
          </div>
          <div className="w-full max-w-sm self-start sm:self-auto">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                Match score
              </p>
              <span className="rounded-full bg-(--color-tint) px-2.5 py-1 text-xs font-medium text-(--color-ink)">
                {scoreBandLabel(score)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-4xl font-semibold leading-none tabular-nums ${
                  score >= 75
                    ? "text-(--color-signal-green)"
                    : score >= 50
                      ? "text-(--color-signal-amber)"
                      : "text-(--color-signal-clay)"
                }`}
              >
                {score}
              </span>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-(--color-tint)"
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress match score"
            >
              <div
                className={
                  score >= 75
                    ? "h-full rounded-full bg-(--color-signal-green)"
                    : score >= 50
                      ? "h-full rounded-full bg-(--color-signal-amber)"
                      : "h-full rounded-full bg-(--color-signal-clay)"
                }
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            {dimensions.filter((d) => d.applicable).length > 0 ? (
              <p className="mt-2 text-xs leading-relaxed text-(--color-muted)">
                {dimensions
                  .filter((d) => d.applicable)
                  .map((d) => `${d.label} ${Math.round(d.ratio * 100)}%`)
                  .join(", ")}
              </p>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-(--color-ink)">
          {describeProgress(score)}
          {score < 50 ? (
            <>
              {" "}
              <Link
                href="/app/belajar"
                className="font-medium text-(--color-teal) underline-offset-4 hover:underline"
              >
                Pilih target lain
              </Link>
              .
            </>
          ) : null}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <SkillGroup
            title="Sudah ada di profilmu"
            items={matched.slice(0, 4)}
            tone="green"
          />
          <SkillGroup
            title="Perlu ditutup"
            items={gaps}
            tone="amber"
            inRoadmap={roadmapGapIds}
            hrefForSkill={(skillId) => {
              const practice = practiceTasks.find(
                (task) => task.skillId === skillId,
              );
              const suffix = `?target=${encodeURIComponent(targetJob.id)}`;
              if (practice) return `/app/belajar/${practice.slug}${suffix}`;
              return `/app/belajar/latihan-praktik-${skillId}${suffix}`;
            }}
          />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="roadmap-heading">
        <div>
          <h2
            id="roadmap-heading"
            className="text-xl font-semibold tracking-tight text-(--color-ink)"
          >
            Roadmap belajar
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
            Setiap langkah punya bukti yang bisa kamu pakai untuk update
            profil dan menjelaskan kesiapan ke HR.
          </p>
          <p className="mt-2 text-sm text-(--color-muted)">
            <strong className="font-semibold text-(--color-ink)">
              {roadmap.length}
            </strong>{" "}
            langkah
            {roadmap.filter((s) => s.completed).length > 0 ? (
              <>
                ,{" "}
                <strong className="font-semibold text-(--color-ink)">
                  {roadmap.filter((s) => s.completed).length}
                </strong>{" "}
                sudah selesai
              </>
            ) : null}
            .
          </p>
        </div>

        <ol className="mt-6 grid gap-4 lg:grid-cols-3">
          {pagedRoadmap.map((step, i) => (
            <RoadmapCard
              key={`${step.label}-${i}`}
              step={step}
              index={roadmapStart + i}
            />
          ))}
        </ol>
        {roadmapTotalPages > 1 ? (
          <Pagination
            className="mt-8"
            currentPage={currentRoadmapPage}
            totalPages={roadmapTotalPages}
            hrefForPage={(page) =>
              belajarHref({
                target: targetJob.id,
                roadmapPage: page,
              })
            }
            label="roadmap belajar"
          />
        ) : null}
      </section>
    </>
  );
}

function TargetPicker({
  candidates,
  notice,
}: {
  candidates: {
    job: Job;
    score: number;
    missingCount: number;
    totalSkills: number;
  }[];
  notice?: string;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Belajar"
        title="Pilih lowongan yang ingin kamu kejar"
        description="Roadmap belajar disusun khusus untuk satu lowongan target. Pilih dari rekomendasi di bawah, atau telusuri dulu di halaman lowongan."
        action={
          <Link
            href="/app/lowongan"
            className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
          >
            Telusuri semua lowongan
          </Link>
        }
      />

      {notice ? (
        <div
          role="status"
          className="mt-6 max-w-2xl rounded-lg border border-(--color-signal-amber)/40 bg-(--color-tint) p-4 text-sm text-(--color-ink)"
        >
          {notice}
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="picker-heading">
        <h2
          id="picker-heading"
          className="text-sm font-medium uppercase tracking-wider text-(--color-muted)"
        >
          Lowongan rekomendasi
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {candidates.map(({ job, score, missingCount, totalSkills }) => (
            <li key={job.id}>
              <Link
                href={belajarHref({ target: job.id })}
                className="group flex h-full flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-5 transition-colors hover:border-(--color-teal)"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-(--color-ink) group-hover:text-(--color-teal)">
                      {job.title}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-(--color-muted)">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-semibold tabular-nums text-(--color-teal)">
                    {score}%
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-(--color-muted)">
                  {missingCount === 0
                    ? `Semua ${totalSkills} skill sudah ada di profilmu. Tinggal lamar.`
                    : `${missingCount} dari ${totalSkills} skill perlu ditutup. Roadmap akan fokus ke gap itu.`}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) group-hover:text-(--color-teal-deep)">
                  Susun roadmap →
                  <LinkPendingIndicator />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function RoadmapCard({
  step,
  index,
}: {
  step: RoadmapStep;
  index: number;
}) {
  const isLocked = Boolean(step.locked);
  const isCompleted = Boolean(step.completed);
  const isFinal = Boolean(step.isFinal);

  const cardTone = isLocked
    ? "border-dashed border-(--color-line) bg-(--color-tint)/40"
    : isCompleted
      ? "border-(--color-signal-green)/40 bg-(--color-paper)"
      : isFinal
        ? "border-(--color-teal) bg-(--color-tint)"
        : "border-(--color-line) bg-(--color-paper)";

  const labelTone = isLocked
    ? "bg-(--color-paper) text-(--color-muted)"
    : isCompleted
      ? "bg-(--color-paper) text-(--color-signal-green)"
      : "bg-(--color-tint) text-(--color-teal)";

  return (
    <li
      className={`flex flex-col rounded-lg border p-5 ${cardTone}`}
      aria-current={isFinal && !isLocked ? "step" : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${labelTone}`}
        >
          {step.label}
        </span>
        <span className="text-xs text-(--color-muted)">
          {isFinal ? "Final" : `Langkah ${index + 1}`}
        </span>
      </div>

      {isCompleted ? (
        <span
          className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-(--color-tint) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
            step.passed === false
              ? "text-(--color-signal-amber)"
              : "text-(--color-signal-green)"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            {step.passed === false ? (
              <path
                d="M3 7.5 6 4l3 3.5M6 4v6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M2.5 6.5 5 9l4.5-5.5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          {step.passed === false
            ? typeof step.score === "number"
              ? `Perlu diperbaiki · ${step.score}/100`
              : "Perlu diperbaiki"
            : typeof step.score === "number"
              ? `Selesai · ${step.score}/100`
              : "Selesai"}
        </span>
      ) : step.allClear ? (
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-(--color-tint) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-(--color-signal-green)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2.5 6.5 5 9l4.5-5.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Profil cocok
        </span>
      ) : isLocked ? (
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-(--color-paper) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-(--color-muted)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M3.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5M3 5.5h6v4.5H3z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Terkunci
        </span>
      ) : null}

      {step.skillLabel && !isFinal ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal-deep)">
            Skill: {step.skillLabel}
          </p>
        </div>
      ) : null}

      <h3 className="mt-4 text-base font-semibold text-(--color-ink)">
        {step.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-(--color-muted)">
        {step.body}
      </p>

      {step.estimatedMinutes && !isCompleted && !isLocked ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-(--color-muted)">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M6 3.5V6l1.6 1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Estimasi {step.estimatedMinutes} menit
        </p>
      ) : null}

      <p className="mt-4 rounded-md bg-(--color-tint) p-3 text-xs leading-relaxed text-(--color-ink)">
        {step.evidence}
      </p>

      <div className="mt-4 grid gap-2">
        {step.href && !isLocked ? (
          <Link
            href={step.href}
            className={
              isCompleted
                ? "inline-flex items-center justify-center gap-2 rounded-md border border-(--color-signal-green) bg-(--color-paper) px-4 py-2 text-sm font-semibold text-(--color-signal-green) hover:border-(--color-teal) hover:text-(--color-teal)"
                : isFinal
                  ? "inline-flex items-center justify-center rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                  : "inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
            }
          >
            {step.action}
          </Link>
        ) : (
          <span
            aria-disabled
            className="inline-flex items-center justify-center rounded-md border border-dashed border-(--color-line) bg-(--color-paper) px-4 py-2 text-sm font-medium text-(--color-muted)"
          >
            {step.action}
          </span>
        )}
        {step.disabledReason ? (
          <p className="text-xs leading-relaxed text-(--color-muted)">
            {step.disabledReason}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function NoJobsState() {
  return (
    <>
      <PageHeader
        eyebrow="Belajar"
        title="Belum ada target kerja"
        description="Kami belum menemukan lowongan aktif yang bisa dijadikan target roadmap saat ini. Coba buka halaman lowongan atau pilih target lain setelah data lowongan tersedia."
      />
      <div className="mt-10 rounded-lg border border-(--color-line) bg-(--color-tint) p-8">
        <p className="text-sm font-semibold text-(--color-ink)">
          Mulai dari profilmu
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
          Profilmu tetap tersimpan. Roadmap belajar akan muncul saat ada
          lowongan aktif yang bisa dibandingkan dengan skill di profilmu.
        </p>
        <Link
          href="/app/lowongan"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
        >
          Lihat lowongan →
        </Link>
      </div>
    </>
  );
}

function SkillGroup({
  title,
  items,
  tone,
  hrefForSkill,
  inRoadmap,
}: {
  title: string;
  items: ReturnType<typeof calcMatch>["breakdown"];
  tone: "green" | "amber";
  hrefForSkill?: (skillId: string) => string | null;
  inRoadmap?: Set<string>;
}) {
  return (
    <div className="rounded-md border border-(--color-line) bg-(--color-tint) p-4">
      <p className="text-xs font-medium text-(--color-muted)">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-(--color-muted)">Tidak ada.</li>
        ) : (
          items.map((item) => {
            const href = hrefForSkill ? hrefForSkill(item.skillId) : null;
            const inMap = inRoadmap?.has(item.skillId) ?? false;
            const status = inMap ? (
              <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-(--color-paper) px-2.5 py-1 text-xs font-medium text-(--color-teal)">
                Di roadmap
              </span>
            ) : (
              <LevelStatus item={item} tone={tone} />
            );
            const inner = (
              <>
                <span className="text-sm font-medium text-(--color-ink)">
                  {item.name}
                </span>
                {status}
                {href ? (
                  <span
                    aria-hidden
                    className="ml-1 text-(--color-muted) opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    →
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={item.skillId}>
                {href ? (
                  <Link
                    href={href}
                    className="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-sm py-1 -mx-1 px-1 hover:bg-(--color-paper) focus-visible:bg-(--color-paper) focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-teal)"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="text-sm font-medium text-(--color-ink)">
                      {item.name}
                    </span>
                    {status}
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function LevelStatus({
  item,
  tone,
}: {
  item: ReturnType<typeof calcMatch>["breakdown"][number];
  tone: "green" | "amber";
}) {
  if (item.state === "match") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-(--color-paper) px-2.5 py-1 text-xs font-medium text-(--color-signal-green)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.5 5 9l4.5-5.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Sudah ada
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-(--color-paper) px-2.5 py-1 text-xs font-medium ${
        tone === "green"
          ? "text-(--color-signal-green)"
          : "text-(--color-signal-amber)"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M3 7.5 6 4l3 3.5M6 4v6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Belum ada
    </span>
  );
}

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import {
  listPracticeAttemptsForUser,
  type PracticeAttempt,
} from "@/lib/attempts-store";
import { calcMatch } from "@/lib/match";
import { rankCandidateJobs } from "@/lib/recommendations";
import { findCoursesForGapsAsync } from "@/lib/courses-store";
import { readCachedGapExplanations } from "@/lib/gap-explain";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { getGeneratedPracticeTask } from "@/lib/practice-generation";
import { listPracticeTasksAsync } from "@/lib/practice-store";
import { skillById } from "@/lib/skills";
import type { Course, Job, PracticeTask } from "@/lib/types";

type SearchParams = Promise<{
  target?: string;
  roadmapPage?: string;
}>;

const MAX_GAP_STEPS = 2;
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

function formatGoogleDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function googleCalendarHref({
  title,
  details,
  dayOffset,
  daySpan = 1,
}: {
  title: string;
  details: string;
  dayOffset: number;
  daySpan?: number;
}) {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + daySpan);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

type RoadmapStep = {
  label: string;
  title: string;
  body: string;
  evidence: string;
  href?: string;
  action: string;
  completed?: boolean;
  score?: number;
  disabledReason?: string;
  calendarHref: string;
};

function skillName(skillId: string, fallback?: string): string {
  return fallback ?? skillById[skillId]?.name ?? skillId;
}

async function generatePriorityPracticeTasks(
  skillIds: string[],
): Promise<PracticeTask[]> {
  const uniqueSkillIds = Array.from(new Set(skillIds)).slice(0, MAX_GAP_STEPS);
  const tasks = await Promise.all(
    uniqueSkillIds.map((skillId) => getGeneratedPracticeTask(skillId)),
  );
  return tasks.filter((task): task is PracticeTask => Boolean(task));
}

function buildRoadmap(
  gaps: { skillId: string; name: string }[],
  courses: Course[],
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
        label: "Hari 1",
        title: "Profilmu sudah cocok",
        body: "Semua skill yang diminta lowongan ini sudah ada di profilmu. Lanjutkan dengan menulis surat lamaran yang spesifik untuk perusahaan ini.",
        evidence:
          "Bisa menjelaskan dua pengalaman paling relevan dan satu hasil terukur.",
        href: `/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`,
        action: "Lihat lowongan",
        calendarHref: googleCalendarHref({
          title: `Siapkan lamaran ${targetJob.title}`,
          details: `Roadmap Akselerja: tulis lamaran spesifik untuk ${targetJob.company}.`,
          dayOffset: 0,
        }),
      },
    ];
  }

  const dayOffsets = [0, 2, 5, 9];
  const daySpans = [1, 2, 3, 3];
  const labels = ["Hari 1", "Hari 3-4", "Minggu 1", "Minggu 2"];

  const completedSteps: RoadmapStep[] = completedTasks
    .slice(0, MAX_GAP_STEPS)
    .map((task, idx) => {
    const attempt = latestAttemptByTaskId.get(task.id);
    const name = skillName(task.skillId);
    return {
      label: labels[idx] ?? `Tahap ${idx + 1}`,
      title: `Tutup gap ${name}`,
      body: attempt?.passed
        ? `Latihan ${task.title} sudah selesai dan skill ini sudah menjadi bukti di profilmu.`
        : `Jawaban terakhir untuk ${task.title} sudah tersimpan. Buka lagi untuk melihat feedback dan memperbaiki jawaban.`,
      evidence: attempt
        ? `${task.title} · skor ${attempt.score}/100.`
        : task.title,
      action: "Selesai",
      href: `/app/belajar/${task.slug}`,
      completed: true,
      score: attempt?.score,
      calendarHref: googleCalendarHref({
        title: `Review latihan ${name}`,
        details: `Roadmap Akselerja: review jawaban dan feedback untuk ${task.title}.`,
        dayOffset: dayOffsets[idx] ?? idx * 3,
        daySpan: 1,
      }),
    };
  });

  const gapSteps: RoadmapStep[] = openGaps
    .slice(0, Math.max(0, MAX_GAP_STEPS - completedSteps.length))
    .map((gap, offset) => {
      const idx = completedSteps.length + offset;
      const course = courses.find((c) => c.skillId === gap.skillId);
      const practice = practiceTasks.find(
        (task) => task.skillId === gap.skillId,
      );
      const generatedPractice =
        practice?.sourceLabel === "Referensi SKKNI" ? practice : null;
      const name = skillName(gap.skillId, gap.name);
      const ragBody = explanations.get(gap.skillId);
      const fallbackBody = course
        ? `${course.provider} sediakan ${course.title} dengan durasi ${course.durationHours} jam. Skill ini muncul sebagai syarat di lowongan target kamu.`
        : `Latihan mandiri disiapkan untuk ${name}. Jawabanmu akan menjadi bukti awal bahwa skill ini bisa ditambahkan ke profil setelah skornya cukup.`;
      return {
        label: labels[idx] ?? `Tahap ${idx + 1}`,
        title: generatedPractice?.title ?? `Tutup gap ${name}`,
        body: generatedPractice?.scenario ?? ragBody ?? fallbackBody,
        evidence:
          generatedPractice?.expectedEvidence?.[0] ??
          (course
            ? `${course.title} (${course.provider}, ${course.durationHours} jam${course.free ? ", gratis" : ""}).`
            : `Bisa menjelaskan minimal satu kasus konkret dari ${name} dan apa hasilnya.`),
        action: practice
          ? "Mulai Praktik"
          : course
            ? "Buka materi"
            : "Mulai Latihan",
        href: practice
          ? `/app/belajar/${practice.slug}`
          : course
            ? `/app/belajar/kursus/${course.id}`
            : `/app/belajar/latihan-praktik-${gap.skillId}`,
        calendarHref: googleCalendarHref({
          title: `Belajar ${name}`,
          details: `Roadmap Akselerja: tutup gap ${name} untuk ${targetJob.title} di ${targetJob.company}.`,
          dayOffset: dayOffsets[idx] ?? idx * 3,
          daySpan: daySpans[idx] ?? 2,
        }),
      };
    });

  const steps: RoadmapStep[] = [...completedSteps, ...gapSteps];

  steps.push({
    label: "Minggu 2",
    title: "Update profil dan lamar",
    body: "Setelah gap prioritas selesai, hasil belajar jadi bukti kesiapan kerja. Update profil supaya match score-nya ikut naik, lalu lamar.",
    evidence:
      "Profil punya skill baru, dan kamu siap menjelaskan satu hal konkret untuk tiap skill.",
    href: `/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`,
    action: "Lihat lowongan",
    calendarHref: googleCalendarHref({
      title: `Update profil dan lamar ${targetJob.title}`,
      details: `Roadmap Akselerja: tambah skill baru ke profil, lalu cek lowongan target.`,
      dayOffset: 13,
    }),
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
    return "Posisi ini bisa kamu kejar, tapi butuh waktu di skill prioritas dulu. Roadmap di bawah memetakan langkahnya.";
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

  const overrideJob = target ? ranked.find((r) => r.job.id === target) : null;
  const top = overrideJob ?? ranked[0];
  const targetJob = top.job;
  const score = top.score;
  const breakdown = top.breakdown;
  const gaps = breakdown.filter((b) => b.state !== "match");
  const matched = breakdown.filter((b) => b.state === "match");

  const gapSkillIds = gaps.map((g) => g.skillId);
  const priorityPracticeSkillIds = gaps
    .slice(0, MAX_GAP_STEPS)
    .map((gap) => gap.skillId);
  const [courses, explanations, generatedPracticeTasks] = await Promise.all([
    findCoursesForGapsAsync(gapSkillIds, 4),
    readCachedGapExplanations({
        job: targetJob,
        gaps: gaps.map((g) => ({ skillId: g.skillId, name: g.name })),
        candidateSkillIds: me.skills.map((s) => s.skillId),
        limit: 4,
      }),
    generatePriorityPracticeTasks(priorityPracticeSkillIds),
  ]);
  const practiceTasks = [...generatedPracticeTasks, ...basePracticeTasks];
  const roadmap = buildRoadmap(
    gaps,
    courses,
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

  const nearbyMatches = ranked
    .filter((r) => r.job.id !== targetJob.id)
    .slice(0, 3)
    .map((r) => ({ job: r.job, score: r.score }));

  const hasGaps = gaps.length > 0;
  const focusGap = gaps[0];
  const focusCourse = focusGap
    ? courses.find((c) => c.skillId === focusGap.skillId)
    : null;

  const description = overrideJob
    ? `Roadmap dari requirement spesifik ${targetJob.company}, disesuaikan dengan profilmu.`
    : "Roadmap ini berbasis lowongan paling cocok denganmu sekarang. Kalau kamu update profil atau pilih target lain, roadmap-nya ikut berubah.";

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
            <Link
              href={`/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`}
              className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
            >
              Lihat lowongan
            </Link>
            {focusGap ? (
              <Link
                href={`/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`}
                className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
              >
                Mulai dari {skillName(focusGap.skillId, focusGap.name)}
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
        <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
          <p className="text-sm font-medium text-(--color-muted)">
            Target kerja saat ini
          </p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-(--color-ink)">
                {targetJob.title}
              </h2>
              <p className="mt-1 text-sm text-(--color-muted)">
                {targetJob.company} · {targetJob.location}
              </p>
            </div>
            <div className="w-fit max-w-full self-start rounded-lg bg-(--color-tint) px-4 py-3 text-left sm:self-auto sm:text-right">
              <p className="text-xs text-(--color-muted)">Match score</p>
              <p className="text-3xl font-semibold tabular-nums text-(--color-teal)">
                {score}%
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-(--color-ink)">
            {describeProgress(score)}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SkillGroup
              title="Sudah ada di profilmu"
              items={matched.slice(0, 4)}
              tone="green"
            />
            <SkillGroup title="Perlu ditutup" items={gaps} tone="amber" />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-(--color-muted)">
            {focusCourse ? "Mulai dari sini" : "Fokus utama"}
          </h2>
          <div className="mt-4 rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
            {focusCourse && focusGap ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium text-(--color-teal)">
                    {skillName(focusGap.skillId, focusGap.name)}
                  </p>
                  <span className="text-xs text-(--color-muted)">
                    {focusCourse.free ? "Gratis" : "Berbayar"}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-(--color-ink)">
                  {focusCourse.title}
                </h3>
                <p className="mt-1 text-sm text-(--color-muted)">
                  {focusCourse.provider} · {focusCourse.durationHours} jam
                </p>
                <p className="mt-4 text-sm leading-relaxed text-(--color-ink)">
                  {focusCourse.description}
                </p>
                <Link
                  href={`/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`}
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                >
                  Cek dampak ke skor
                </Link>
              </>
            ) : focusGap ? (
              <>
                <p className="text-xs font-medium text-(--color-teal)">
                  {skillName(focusGap.skillId, focusGap.name)}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-(--color-ink)">
                  Cari materi {skillName(focusGap.skillId, focusGap.name)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                  Belum ada kursus terkurasi untuk skill ini. Cari materi bebas
                  dari sumber yang kamu percaya. Setelah belajar, tambahkan ke
                  profil supaya match score ikut naik.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-(--color-ink)">
                  Lanjut ke lamaran
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                  Tidak ada gap yang harus kamu tutup untuk lowongan ini.
                  Saatnya melamar dengan rasa percaya diri.
                </p>
                <Link
                  href={`/app/lowongan/${targetJob.id}${targetJob.companyId ? `?c=${encodeURIComponent(targetJob.companyId)}` : ""}`}
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                >
                  Lihat lowongan
                </Link>
              </>
            )}
          </div>

          {nearbyMatches.length > 0 ? (
            <NearbyJobsCard matches={nearbyMatches} />
          ) : null}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="roadmap-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="roadmap-heading"
              className="text-xl font-semibold tracking-tight text-(--color-ink)"
            >
              Roadmap belajar 2 minggu
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
              Setiap langkah punya bukti yang bisa kamu pakai untuk update
              profil dan menjelaskan kesiapan ke HR.
            </p>
          </div>
          {hasGaps ? (
            <span className="text-sm text-(--color-muted)">
              Fokus:{" "}
              {gaps
                .slice(0, 2)
                .map((g) => skillName(g.skillId, g.name))
                .join(" + ")}
            </span>
          ) : null}
        </div>

        <ol className="mt-6 grid gap-4 lg:grid-cols-4">
          {pagedRoadmap.map((step, i) => (
            <li
              key={`${step.label}-${i}`}
              className="flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-(--color-tint) px-3 py-1 text-xs font-medium text-(--color-teal)">
                  {step.label}
                </span>
                <span className="text-xs text-(--color-muted)">
                  Langkah {roadmapStart + i + 1}
                </span>
              </div>
              {step.completed ? (
                <span className="mt-3 w-fit rounded-full bg-(--color-tint) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-(--color-signal-green)">
                  {typeof step.score === "number"
                    ? `Selesai · ${step.score}/100`
                    : "Selesai"}
                </span>
              ) : null}
              <h3 className="mt-4 text-base font-semibold text-(--color-ink)">
                {step.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-(--color-muted)">
                {step.body}
              </p>
              <p className="mt-4 rounded-md bg-(--color-tint) p-3 text-xs leading-relaxed text-(--color-ink)">
                {step.evidence}
              </p>
              <div className="mt-4 grid gap-2">
                {step.href ? (
                  <Link
                    href={step.href}
                    className={
                      step.completed
                        ? "inline-flex items-center justify-center gap-2 rounded-md border border-(--color-signal-green) bg-(--color-tint) px-4 py-2 text-sm font-semibold text-(--color-signal-green) hover:border-(--color-teal) hover:text-(--color-teal)"
                        : "inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
                    }
                  >
                    {step.completed ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M3 7.3 5.8 10 11 4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                    {step.action}
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-md bg-(--color-tint) px-4 py-2 text-sm font-medium text-(--color-muted)">
                    {step.action}
                  </span>
                )}
                {step.disabledReason ? (
                  <p className="text-xs leading-relaxed text-(--color-muted)">
                    {step.disabledReason}
                  </p>
                ) : null}
                <a
                  href={step.calendarHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
                >
                  Tambah ke Google Calendar
                </a>
              </div>
            </li>
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

function NearbyJobsCard({
  matches,
}: {
  matches: { job: Job; score: number }[];
}) {
  return (
    <section className="mt-4 rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-(--color-muted)">
          Lowongan terdekat
        </h2>
        <Link
          href="/app/lowongan"
          className="shrink-0 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
        >
          Lihat Semua →
        </Link>
      </div>
      <div className="mt-4 space-y-3">
        {matches.map(({ job, score }) => (
          <Link
            key={job.id}
            href={`/app/belajar?target=${job.id}`}
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-md border border-(--color-line) bg-(--color-paper) px-4 py-3.5 transition-colors hover:border-(--color-teal)"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-(--color-ink) group-hover:text-(--color-teal)">
                {job.title}
              </span>
              <span className="mt-1 block truncate text-xs text-(--color-muted)">
                {job.company}
              </span>
            </span>
            <span className="text-sm font-semibold tabular-nums text-(--color-teal)">
              {score}%
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SkillGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: ReturnType<typeof calcMatch>["breakdown"];
  tone: "green" | "amber";
}) {
  return (
    <div className="rounded-md border border-(--color-line) bg-(--color-tint) p-4">
      <p className="text-xs font-medium text-(--color-muted)">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-(--color-muted)">Tidak ada.</li>
        ) : (
          items.map((item) => (
            <li
              key={item.skillId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
            >
              <span className="text-sm font-medium text-(--color-ink)">
                {item.name}
              </span>
              <LevelStatus item={item} tone={tone} />
            </li>
          ))
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

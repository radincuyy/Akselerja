import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import SkillPracticeRunner from "@/components/belajar/SkillPracticeRunner";
import { getLatestPracticeAttemptForUser } from "@/lib/learning/attempts-store";
import { skillDisplayName } from "@/lib/learning/skills";
import { getPracticeTaskBySlugAsync } from "@/lib/learning/practice-store";
import type { PracticeJobContext } from "@/lib/learning/practice-generation";
import { getJobByIdAsync } from "@/lib/jobs/jobs-store";
import { getCheckpointSet } from "@/lib/learning/checkpoint-generator";
import { getYouTubeMaterial } from "@/lib/learning/youtube-cache";
import { requireUser } from "@/lib/auth/session";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ target?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const task = await getPracticeTaskBySlugAsync(slug);
  if (!task) return {};
  return {
    title: `${task.title} · Akselerja`,
  };
}

export default async function SkillPracticePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { target } = await searchParams;

  const targetJob = target ? await getJobByIdAsync(target) : null;
  const jobContext: PracticeJobContext | undefined = targetJob
    ? {
        jobId: targetJob.id,
        jobTitle: targetJob.title,
        jobCompany: targetJob.company,
      }
    : undefined;

  const user = await requireUser();
  const isDynamic = slug.startsWith("latihan-praktik-") || slug.startsWith("skill-drill-");

  let task;
  let latestAttempt;
  let checkpointSet;
  let videos;
  let skillId: string;
  let taskId: string;

  if (isDynamic) {
    skillId = slug.startsWith("latihan-praktik-")
      ? slug.slice("latihan-praktik-".length)
      : slug.slice("skill-drill-".length);
    taskId = slug;

    const requirementName = targetJob?.requirements.find(
      (r) => r.skillId === skillId,
    )?.name;
    const skillName = requirementName ?? skillDisplayName(skillId);

    const [fetchedTask, attempt, checkSet, ytVideos] = await Promise.all([
      getPracticeTaskBySlugAsync(slug, jobContext),
      getLatestPracticeAttemptForUser(user.id, taskId),
      getCheckpointSet(skillId, {
        skillName,
        jobContext: targetJob ?? undefined,
      }),
      getYouTubeMaterial(skillId, skillName),
    ]);

    if (!fetchedTask) notFound();
    task = fetchedTask;
    latestAttempt = attempt;
    checkpointSet = checkSet;
    videos = ytVideos;
  } else {
    const fetchedTask = await getPracticeTaskBySlugAsync(slug, jobContext);
    if (!fetchedTask) notFound();
    task = fetchedTask;
    skillId = task.skillId;
    taskId = task.id;

    const requirementName = targetJob?.requirements.find(
      (r) => r.skillId === skillId,
    )?.name;
    const skillName = requirementName ?? skillDisplayName(skillId);

    const [attempt, checkSet, ytVideos] = await Promise.all([
      getLatestPracticeAttemptForUser(user.id, taskId),
      getCheckpointSet(skillId, {
        skillName,
        jobContext: targetJob ?? undefined,
      }),
      getYouTubeMaterial(skillId, skillName),
    ]);

    latestAttempt = attempt;
    checkpointSet = checkSet;
    videos = ytVideos;
  }

  const requirementName = targetJob?.requirements.find(
    (r) => r.skillId === skillId,
  )?.name;
  const skillName = requirementName ?? skillDisplayName(skillId);

  const mcQuestions = checkpointSet.questions.slice(0, 5).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options,
  }));
  const eyebrow = targetJob
    ? `${targetJob.title} · ${skillName}`
    : `${task.role} · ${skillName}`;

  return (
    <>
      <Link
        href={target ? `/app/belajar?target=${encodeURIComponent(target)}` : "/app/belajar"}
        className="inline-flex items-center gap-1.5 text-sm text-(--color-muted) hover:text-(--color-ink)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M9 4 5 7l4 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Kembali ke Skill Gap Lab
      </Link>

      <div className="mt-6">
        <PageHeader
          eyebrow={eyebrow}
          title={`Pelajari ${skillName}`}
          description="Kerjakan simulasi seperti pekerjaan nyata. Jawabanmu dinilai memakai rubrik yang sama dengan bank pengetahuan Akselerja."
        />
      </div>

      <div className="mt-10">
        <SkillPracticeRunner
          task={task}
          skillName={skillName}
          initialAttempt={latestAttempt}
          mcQuestions={mcQuestions}
          mcGeneratedBy={checkpointSet.generatedBy}
          videos={videos}
          target={target}
        />
      </div>
    </>
  );
}

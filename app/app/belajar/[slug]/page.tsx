import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SkillPracticeRunner from "@/components/SkillPracticeRunner";
import { getLatestPracticeAttemptForUser } from "@/lib/attempts-store";
import { skillById } from "@/lib/skills";
import {
  getPracticeTaskBySlugAsync,
  listPracticeTasksAsync,
} from "@/lib/practice-store";
import { requireUser } from "@/lib/session";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const tasks = await listPracticeTasksAsync();
  return tasks.map((task) => ({ slug: task.slug }));
}

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
}: {
  params: Params;
}) {
  const { slug } = await params;
  const task = await getPracticeTaskBySlugAsync(slug);
  if (!task) notFound();

  const user = await requireUser();
  const latestAttempt = await getLatestPracticeAttemptForUser(user.id, task.id);
  const skillName = skillById[task.skillId]?.name ?? "Skill";

  return (
    <>
      <Link
        href="/app/belajar"
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
          eyebrow={`${task.role} · ${skillName}`}
          title={task.title}
          description="Kerjakan simulasi seperti pekerjaan nyata. Jawabanmu dinilai memakai rubrik yang sama dengan bank pengetahuan Akselerja."
        />
      </div>

      <div className="mt-10">
        <SkillPracticeRunner
          task={task}
          skillName={skillName}
          initialAttempt={latestAttempt}
        />
      </div>
    </>
  );
}

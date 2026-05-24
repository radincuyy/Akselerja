import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import { skillById } from "@/lib/skills";
import { listAssessmentsAsync } from "@/lib/assessments-store";
import { completedAssessmentIdsForUser } from "@/lib/attempts-store";
import { requireUser } from "@/lib/session";

type SearchParams = Promise<{ page?: string }>;

const PAGE_SIZE = 6;

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function assessmentPageHref(page: number): string {
  return page <= 1 ? "/app/assessment" : `/app/assessment?page=${page}`;
}

export default async function AssessmentListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page } = await searchParams;
  const user = await requireUser();
  const [assessments, completedIds] = await Promise.all([
    listAssessmentsAsync(),
    completedAssessmentIdsForUser(user.id),
  ]);
  const totalPages = Math.max(1, Math.ceil(assessments.length / PAGE_SIZE));
  const currentPage = Math.min(parsePage(page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pagedAssessments = assessments.slice(start, start + PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Buktikan skill kamu, bukan hanya tulis"
        description="Setiap assessment singkat dan langsung memengaruhi match score. Selesaikan satu, dan rekomendasi lowongan jadi lebih akurat untukmu."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {pagedAssessments.map((a) => {
          const isDone = completedIds.has(a.id);
          return (
            <article
              key={a.id}
              className="flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                    {skillById[a.skillId]?.name ?? "Skill"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-(--color-ink)">
                    {a.title}
                  </h2>
                </div>
                {isDone ? (
                  <span className="shrink-0 rounded-full bg-(--color-tint) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-(--color-signal-green)">
                    Selesai
                  </span>
                ) : null}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-(--color-muted)">
                {a.description}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 text-xs text-(--color-muted)">
                <span>
                  {a.questionCount} soal · {a.durationMinutes} menit
                </span>
                <Link
                  href={`/app/assessment/${a.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
                >
                  {isDone ? "Ulangi" : "Mulai"} →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        className="mt-8"
        currentPage={currentPage}
        totalPages={totalPages}
        hrefForPage={assessmentPageHref}
        label="assessment"
      />
    </>
  );
}

import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { assessments, skillById } from "@/lib/mock-data";
import { completedAssessmentIds } from "@/lib/format";

export default function AssessmentListPage() {
  return (
    <AppShell variant="candidate" active="/app/assessment">
      <PageHeader
        eyebrow="Assessment"
        title="Buktikan skill kamu, bukan hanya tulis"
        description="Setiap assessment singkat dan langsung memengaruhi match score. Selesaikan satu, dan rekomendasi lowongan jadi lebih akurat untukmu."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {assessments.map((a) => {
          const isDone = completedAssessmentIds.has(a.id);
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
                {isDone && (
                  <span className="shrink-0 rounded-full bg-(--color-tint) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-(--color-signal-green)">
                    Selesai
                  </span>
                )}
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
    </AppShell>
  );
}

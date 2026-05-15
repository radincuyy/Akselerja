import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import AssessmentRunner from "@/components/AssessmentRunner";
import { assessments, assessmentQuestions, skillById } from "@/lib/mock-data";

type Params = Promise<{ slug: string }>;

export default async function AssessmentRunPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const assessment = assessments.find((a) => a.slug === slug);
  if (!assessment) notFound();
  const questions = assessmentQuestions[slug] ?? [];

  return (
    <AppShell variant="candidate" active="/app/assessment">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
          Assessment · {skillById[assessment.skillId]?.name}
        </p>
        <h1 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-(--color-ink)">
          {assessment.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-(--color-muted)">
          {questions.length} soal pilihan ganda. Tidak ada batas waktu ketat;
          ambil waktu sebentar untuk membaca tiap pilihan.
        </p>

        <div className="mt-10">
          <AssessmentRunner
            slug={slug}
            questions={questions}
            assessmentTitle={assessment.title}
          />
        </div>
      </div>
    </AppShell>
  );
}

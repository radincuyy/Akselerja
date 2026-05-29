import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import CheckpointQuiz from "@/components/CheckpointQuiz";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { getCheckpointSet } from "@/lib/checkpoint-generator";
import { findCoursesForGapsAsync } from "@/lib/courses-store";
import { skillById } from "@/lib/skills";
import { classifySkillTrack } from "@/lib/skill-track";
import {
  getLatestCheckpointAttemptForUser,
} from "@/lib/attempts-store";

type Props = {
  params: Promise<{ skillId: string }>;
};

function curatedSearchLinks(skillName: string) {
  const q = encodeURIComponent(`${skillName} tutorial`);
  return [
    {
      label: "Cari di YouTube",
      url: `https://www.youtube.com/results?search_query=${q}`,
    },
    {
      label: "Cari di Coursera",
      url: `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}`,
    },
    {
      label: "Cari di Skill Academy Ruangguru",
      url: `https://www.skillacademy.com/search?query=${encodeURIComponent(skillName)}`,
    },
  ];
}

export default async function ToolBelajarPage({ params }: Props) {
  const { skillId } = await params;
  const { user, profile: me } = await getCurrentCandidate();

  const profileSkill = me.skills?.find((s) => s.skillId === skillId);
  const skillName =
    profileSkill?.name ?? skillById[skillId]?.name ?? skillId;

  const track = classifySkillTrack(skillId, skillName);
  if (track !== "tool") {
    return notFound();
  }

  const [courses, checkpointSet, latestAttempt] = await Promise.all([
    findCoursesForGapsAsync([skillId], 4),
    getCheckpointSet(skillId),
    getLatestCheckpointAttemptForUser(user.id, skillId),
  ]);

  const courseForSkill = courses.find((c) => c.skillId === skillId);
  const fallbackLinks = curatedSearchLinks(skillName);

  return (
    <>
      <PageHeader
        eyebrow="Belajar"
        title={`Pelajari ${skillName}`}
        description="Buka materi dari sumber terkurasi atau cari di provider lain. Setelah merasa cukup paham, kerjakan checkpoint singkat di bawah untuk menambahkan skill ke profilmu."
        action={
          <Link
            href="/app/belajar"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
          >
            Kembali ke roadmap
          </Link>
        }
      />

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
            <h2 className="text-base font-semibold text-(--color-ink)">
              Materi belajar
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
              Mulai dari materi yang paling sesuai dengan gaya belajarmu. Setelah
              selesai, kembali ke halaman ini untuk mengerjakan checkpoint.
            </p>

            {courseForSkill ? (
              <div className="mt-5 rounded-md border border-(--color-line) bg-(--color-tint) p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal-deep)">
                  Pilihan utama
                </p>
                <p className="mt-2 text-base font-semibold text-(--color-ink)">
                  {courseForSkill.title}
                </p>
                <p className="mt-1 text-sm text-(--color-muted)">
                  {courseForSkill.provider} · {courseForSkill.durationHours} jam
                  {courseForSkill.free ? ", gratis" : ", berbayar"}
                </p>
                {courseForSkill.url ? (
                  <a
                    href={courseForSkill.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Buka kursus ${courseForSkill.title} di tab baru`}
                    className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
                  >
                    Buka kursus
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M5 3h6v6M11 3l-7 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-(--color-muted)">
                    Link kursus belum tersedia. Pakai pencarian umum di bawah
                    untuk mulai.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-(--color-line) bg-(--color-tint) p-5">
                <p className="text-sm leading-relaxed text-(--color-muted)">
                  Belum ada kursus terkurasi khusus untuk skill ini. Pakai
                  pencarian umum di bawah untuk mulai.
                </p>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                Pencarian umum
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {fallbackLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${link.label} (membuka tab baru)`}
                      className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-(--color-line) bg-(--color-paper) px-4 py-2.5 text-sm text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
                    >
                      <span>{link.label}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M4.5 2.5h5v5M9.5 2.5l-6 6"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <CheckpointQuiz
            skillId={skillId}
            skillName={checkpointSet.skillName}
            questions={checkpointSet.questions}
          />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
            <h2 className="text-sm font-medium text-(--color-muted)">
              Cara kerja jalur ini
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-(--color-ink)">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-xs font-semibold text-(--color-teal)">
                  1
                </span>
                <span>Buka materi pilihan utama atau cari di provider lain.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-xs font-semibold text-(--color-teal)">
                  2
                </span>
                <span>Pelajari konsep inti, jangan terburu-buru.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-xs font-semibold text-(--color-teal)">
                  3
                </span>
                <span>
                  Kembali ke halaman ini, kerjakan checkpoint 10 soal. Lulus 7
                  dari 10, skill ditambah ke profil.
                </span>
              </li>
            </ol>
          </div>

          {latestAttempt ? (
            <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                Percobaan terakhir
              </p>
              <p className="mt-2 text-sm leading-relaxed text-(--color-ink)">
                {latestAttempt.passed
                  ? `Sudah lulus dengan ${latestAttempt.correct}/${latestAttempt.total} benar. Kamu bisa coba lagi untuk memperdalam pemahaman.`
                  : `Belum lulus, ${latestAttempt.correct}/${latestAttempt.total} benar. Buka materi lagi sebelum coba ulang.`}
              </p>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}

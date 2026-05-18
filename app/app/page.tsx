import Link from "next/link";
import AppShell from "@/components/AppShell";
import ScoreDisplay from "@/components/ScoreDisplay";
import JobCard from "@/components/JobCard";
import { skillById } from "@/lib/skills";
import { calcMatch } from "@/lib/match";
import { searchJobs } from "@/lib/search-store";
import { listAssessmentsAsync } from "@/lib/assessments-store";
import { getProfileOrSeedAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";
import { completedAssessmentIdsForUser } from "@/lib/attempts-store";

export default async function CandidateHome() {
  const user = await requireUser();
  const profile = await getProfileOrSeedAsync(user.id);
  const [search, assessments, completedIds] = await Promise.all([
    searchJobs({
      top: 50,
      profileVector: profile.profileVector,
      includeClosed: false,
    }),
    listAssessmentsAsync(),
    completedAssessmentIdsForUser(user.id),
  ]);
  const ranked = search.jobs
    .map((job) => ({ job, ...calcMatch(profile, job) }))
    .sort((a, b) => b.score - a.score);
  const top3 = ranked.slice(0, 3);
  const matchingCount = ranked.filter((r) => r.score >= 60).length;
  const hasSkills = (profile.skills?.length ?? 0) > 0;
  const hasJobs = top3.length > 0;
  const canShowRecommendations = hasSkills && hasJobs;

  const firstName = profile.name.split(" ")[0] || "kamu";
  const heading = !hasSkills
    ? `Halo ${firstName}, profilmu masih perlu diisi.`
    : matchingCount === 0
      ? `Belum ada lowongan yang cocok hari ini, ${firstName}.`
      : matchingCount === 1
        ? `Hari ini ada 1 lowongan yang cocok denganmu.`
        : `Hari ini ada ${matchingCount} lowongan yang cocok denganmu.`;

  const subhead = !hasSkills
    ? "Lengkapi skill dan pengalaman supaya kami bisa memilihkan lowongan yang benar-benar cocok untukmu, bukan asal urut."
    : matchingCount === 0
      ? "Lengkapi profil atau ikuti satu assessment supaya kami bisa mencocokkan kamu lebih akurat saat lowongan baru masuk."
      : `Lowongan dihitung cocok kalau match score-nya 60% ke atas. Skor naik begitu kamu menambah skill, mengikuti assessment, atau melengkapi pengalaman.`;

  return (
    <AppShell active="/app">
      <section aria-labelledby="dashboard-heading">
        <p className="text-base text-(--color-muted)">
          Selamat datang kembali, {firstName}.
        </p>
        <h1
          id="dashboard-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl lg:text-4xl"
        >
          {heading}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-(--color-muted)">
          {subhead}
        </p>
      </section>

      <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
        <ScoreDisplay
          score={profile.readinessScore}
          label="Skor kesiapan kerja"
          explanation="Skor ini menggabungkan kelengkapan profil, hasil assessment, dan pengalaman yang kamu tulis. Naikkan dengan satu langkah konkret di bawah."
          action={{ label: "Tingkatkan skor", href: "/app/assessment" }}
          size="lg"
        />
      </section>

      <section className="mt-14" aria-labelledby="recs-heading">
        <div className="flex items-end justify-between gap-4">
          <h2
            id="recs-heading"
            className="text-xl font-semibold tracking-tight text-(--color-ink)"
          >
            Lowongan yang paling cocok
          </h2>
          <Link
            href="/app/lowongan"
            className="text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
          >
            Lihat semua →
          </Link>
        </div>
        {canShowRecommendations ? (
          <div className="mt-6 grid gap-4">
            {top3.map(({ job, score, breakdown }) => {
              const top = breakdown.find((b) => b.state === "match");
              const reason = top
                ? `Cocok karena ${skillById[top.skillId]?.name ?? top.name}.`
                : "Lihat detail untuk rincian skor.";
              return (
                <JobCard key={job.id} job={job} matchScore={score} topReason={reason} />
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-(--color-line) bg-(--color-tint) p-6">
            <p className="text-sm font-semibold text-(--color-ink)">
              Rekomendasi belum personal
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
              Kami butuh skill dan pengalamanmu untuk memilih lowongan yang
              spesifik. Setelah profil lengkap, kotak ini berisi tiga lowongan
              paling cocok denganmu, bukan acak.
            </p>
            <Link
              href={profile.cv ? "/app/profil" : "/app/profil/cv"}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
            >
              {profile.cv ? "Lengkapi profil" : "Upload CV"} →
            </Link>
          </div>
        )}
      </section>

      <section className="mt-14" aria-labelledby="next-heading">
        <h2
          id="next-heading"
          className="text-xl font-semibold tracking-tight text-(--color-ink)"
        >
          Langkah berikutnya untukmu
        </h2>
        <NextSteps
          profile={profile}
          assessments={assessments}
          completedIds={completedIds}
        />
      </section>
    </AppShell>
  );
}

function NextSteps({
  profile,
  assessments,
  completedIds,
}: {
  profile: Awaited<ReturnType<typeof getProfileOrSeedAsync>>;
  assessments: Awaited<ReturnType<typeof listAssessmentsAsync>>;
  completedIds: Set<string>;
}) {
  const nextAssessment = assessments.find((a) => !completedIds.has(a.id));
  const hasExperience = (profile.experience?.length ?? 0) > 0;
  const hasEducation = (profile.education?.length ?? 0) > 0;
  const hasCv = Boolean(profile.cv);

  type Step = { eyebrow: string; title: string; body: string; href: string };
  const steps: Step[] = [];
  if (nextAssessment) {
    steps.push({
      eyebrow: "Assessment",
      title: `Ikuti tes ${nextAssessment.title}`,
      body: `${nextAssessment.questionCount} soal, sekitar ${nextAssessment.durationMinutes} menit. Skor kesiapanmu naik begitu selesai.`,
      href: `/app/assessment/${nextAssessment.slug}`,
    });
  }
  if (!hasCv) {
    steps.push({
      eyebrow: "Profil",
      title: "Upload CV biar profil terisi otomatis",
      body: "Kami ekstrak skill, pendidikan, dan pengalaman dari CV-mu. Hemat waktu, lebih akurat.",
      href: "/app/profil/cv",
    });
  } else if (!hasExperience) {
    steps.push({
      eyebrow: "Profil",
      title: "Tambah pengalaman organisasi atau magang",
      body: "Pengalaman organisasi memperkuat profil kandidat fresh graduate.",
      href: "/app/profil#pengalaman",
    });
  } else if (!hasEducation) {
    steps.push({
      eyebrow: "Profil",
      title: "Lengkapi riwayat pendidikan",
      body: "Pendidikan sering jadi filter awal. Isi sebentar saja.",
      href: "/app/profil#pendidikan",
    });
  } else {
    steps.push({
      eyebrow: "Coach",
      title: "Tanya career coach untuk fokus berikutnya",
      body: "Profil sudah lengkap, assessment sudah jalan. Coach bisa bantu pilih langkah berikutnya yang paling berdampak.",
      href: "/app/coach",
    });
  }

  if (steps.length === 1) {
    steps.push({
      eyebrow: "Belajar",
      title: "Lihat kursus yang menutup skill gap kamu",
      body: "Kursus singkat di area yang paling sering muncul di lowongan target.",
      href: "/app/belajar",
    });
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {steps.slice(0, 2).map((s) => (
        <NextStep
          key={s.href}
          eyebrow={s.eyebrow}
          title={s.title}
          body={s.body}
          href={s.href}
        />
      ))}
    </div>
  );
}

function NextStep({
  eyebrow,
  title,
  body,
  href,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-5 transition-colors hover:border-(--color-teal)"
    >
      <p className="text-sm font-medium text-(--color-teal)">{eyebrow}</p>
      <h3 className="mt-2 text-base font-semibold text-(--color-ink) group-hover:text-(--color-teal)">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">{body}</p>
    </Link>
  );
}

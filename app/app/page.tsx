import Link from "next/link";
import ScoreDisplay from "@/components/ScoreDisplay";
import JobCard from "@/components/JobCard";
import { calcMatch } from "@/lib/match";
import { buildMatchReason } from "@/lib/match-reason";
import { searchJobs } from "@/lib/search-store";
import { getCurrentCandidate } from "@/lib/current-candidate";
import { calculateReadinessScore } from "@/lib/profile-store";
import type { Candidate, Job } from "@/lib/types";

const HOME_RECOMMENDATION_LIMIT = 12;

export default async function CandidateHome() {
  const { profile } = await getCurrentCandidate();
  const readinessScore = calculateReadinessScore(profile);
  const userSkillIds = profile.skills?.map((s) => s.skillId) ?? [];
  const initialSearch = await searchJobs({
    top: HOME_RECOMMENDATION_LIMIT,
    profileVector: profile.profileVector,
    skillIds: userSkillIds.length > 0 ? userSkillIds : undefined,
    includeClosed: false,
  });
  const search =
    initialSearch.jobs.length === 0 && userSkillIds.length > 0
      ? await searchJobs({
          top: HOME_RECOMMENDATION_LIMIT,
          profileVector: profile.profileVector,
          includeClosed: false,
        })
      : initialSearch;
  const ranked = search.jobs
    .map((job: Job) => ({ job, ...calcMatch(profile, job) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  const top3 = ranked.slice(0, 3);
  const bestMatchScore = ranked[0]?.score ?? 0;
  const recommendationCount = top3.length;
  const hasStrongMatch = ranked.some((r) => r.score >= 60);
  const mediumMatchCount = ranked.filter((r) => r.score >= 50).length;
  const hasMediumMatch = mediumMatchCount > 0;
  const hasSkills = userSkillIds.length > 0;
  const hasJobs = top3.length > 0;
  const canShowRecommendations = hasSkills && hasJobs;

  const firstName = profile.name.split(" ")[0] || "kamu";
  const heading = !hasSkills
    ? `Halo ${firstName}, profilmu masih perlu diisi.`
    : hasStrongMatch
      ? recommendationCount === 1
        ? "Ini lowongan terbaik untukmu hari ini."
        : `Ini ${recommendationCount} lowongan terbaik untukmu hari ini.`
      : hasMediumMatch
        ? mediumMatchCount === 1
          ? `Ada 1 lowongan yang bisa kamu kejar, ${firstName}.`
          : `Ada ${mediumMatchCount} lowongan yang bisa kamu kejar, ${firstName}.`
        : `Belum ada lowongan yang cocok hari ini, ${firstName}.`;

  const subhead = !hasSkills
    ? "Lengkapi skill dan pengalaman supaya kami bisa memilihkan lowongan yang benar-benar cocok untukmu, bukan asal urut."
    : hasStrongMatch
      ? "Lowongan ini diurutkan dari kecocokan skill, pengalaman, dan preferensi profilmu."
      : hasMediumMatch
        ? "Skill kamu sudah cocok sebagian. Tutup beberapa skill gap supaya peluangmu makin besar."
        : "Lengkapi profil supaya kami bisa mencocokkan kamu lebih akurat saat lowongan baru masuk.";

  return (
    <>
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
          score={readinessScore}
          label="Kelengkapan profil"
          explanation={
            bestMatchScore > 0
              ? `Angka ini membaca kelengkapan profil, CV, skill, dan pengalaman. Ini berbeda dari match score lowongan; match score terbaikmu saat ini ${bestMatchScore}% dan dihitung per lowongan.`
              : "Angka ini membaca kelengkapan profil, CV, skill, dan pengalaman. Match score lowongan akan muncul setelah ada lowongan yang cocok dengan profilmu."
          }
          action={
            readinessScore >= 100
              ? { label: "Lihat lowongan", href: "/app/lowongan" }
              : { label: "Lengkapi profil", href: "/app/profil" }
          }
          size="lg"
          showBand={false}
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
              const reason = buildMatchReason(profile, job, { score, breakdown });
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  matchScore={score}
                  reason={reason}
                />
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
        <NextSteps profile={profile} />
      </section>
    </>
  );
}

function NextSteps({ profile }: { profile: Candidate }) {
  const hasExperience = (profile.experience?.length ?? 0) > 0;
  const hasEducation = (profile.education?.length ?? 0) > 0;
  const hasCv = Boolean(profile.cv);

  type Step = { eyebrow: string; title: string; body: string; href: string };
  const steps: Step[] = [];
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
      body: "Profil sudah lengkap. Coach bisa bantu pilih langkah berikutnya yang paling berdampak.",
      href: "/app/coach",
    });
  }

  steps.push({
    eyebrow: "Belajar",
    title: "Lihat kursus yang menutup skill gap kamu",
    body: "Kursus singkat di area yang paling sering muncul di lowongan target.",
    href: "/app/belajar",
  });

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

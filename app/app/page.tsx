import Link from "next/link";
import AppShell from "@/components/AppShell";
import ScoreDisplay from "@/components/ScoreDisplay";
import JobCard from "@/components/JobCard";
import StatusBadge from "@/components/StatusBadge";
import {
  jobs,
  me,
  assessments,
  calcMatch,
  formatRelativeId,
  skillById,
} from "@/lib/mock-data";
import {
  isUpdatedSinceSeen,
  listApplicationsForCandidate,
} from "@/lib/applications-store";

export default function CandidateHome() {
  const ranked = jobs
    .map((job) => ({ job, ...calcMatch(me, job) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const completedAssessments = 1;

  const myApplications = listApplicationsForCandidate(me.id);
  const recentApplications = myApplications.slice(0, 3);
  const newCount = myApplications.filter((a) => isUpdatedSinceSeen(a)).length;
  const invitedFresh = myApplications.find(
    (a) => a.status === "invited" && isUpdatedSinceSeen(a),
  );
  const acceptedFresh = myApplications.find(
    (a) => a.status === "accepted" && isUpdatedSinceSeen(a),
  );
  const featuredBanner = acceptedFresh ?? invitedFresh;
  const featuredBannerJob = featuredBanner
    ? jobs.find((j) => j.id === featuredBanner.jobId)
    : null;

  return (
    <AppShell variant="candidate" active="/app">
      {featuredBanner && featuredBannerJob ? (
        <Link
          href={`/app/lamaran/${featuredBanner.id}`}
          className="block rounded-lg border border-(--color-teal) bg-(--color-teal-soft) p-5 transition-colors hover:bg-(--color-tint) sm:p-6"
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-teal-deep)">
            Kabar baik
          </p>
          <p className="mt-2 text-base font-semibold leading-snug text-(--color-ink) sm:text-lg">
            {featuredBanner.status === "accepted"
              ? `Selamat, kamu diterima di ${featuredBannerJob.company} untuk ${featuredBannerJob.title}.`
              : `Lamaranmu di ${featuredBannerJob.company} masuk tahap interview.`}
          </p>
          <p className="mt-2 text-sm text-(--color-muted)">
            Lihat detail untuk langkah berikutnya. <span aria-hidden>→</span>
          </p>
        </Link>
      ) : null}

      <section
        aria-labelledby="dashboard-heading"
        className={featuredBanner ? "mt-10" : undefined}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
          Selamat datang kembali, {me.name.split(" ")[0]}
        </p>
        <h1
          id="dashboard-heading"
          className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)"
        >
          Hari ini ada 3 lowongan yang cocok denganmu.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-(--color-muted)">
          Skor kesiapan kerjamu naik 4 poin minggu ini setelah kamu melengkapi
          profil. Lanjutkan satu langkah saja, dan rekomendasinya akan terus
          membaik.
        </p>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
          <ScoreDisplay
            score={me.readinessScore}
            label="Skor kesiapan kerja"
            explanation="Profil kamu lebih siap dari 60% kandidat lain di lokasi yang sama. Untuk masuk top 25%, ikuti satu skill assessment lagi."
            action={{ label: "Tingkatkan skor", href: "/app/assessment" }}
            size="lg"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:w-64">
          <Stat
            label="Lowongan cocok"
            value="12"
            note="match score ≥ 60%"
          />
          <Stat
            label="Assessment"
            value={`${completedAssessments} / 4`}
            note="selesai"
          />
        </div>
      </div>

      {myApplications.length > 0 ? (
        <section className="mt-14" aria-labelledby="my-applications-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="my-applications-heading"
                className="text-xl font-semibold tracking-tight text-(--color-ink)"
              >
                Lamaranmu
              </h2>
              {newCount > 0 ? (
                <p className="mt-1 text-sm text-(--color-muted)">
                  {newCount} lamaran punya status baru sejak terakhir kamu lihat.
                </p>
              ) : (
                <p className="mt-1 text-sm text-(--color-muted)">
                  Pantau perjalanan tiap lamaranmu.
                </p>
              )}
            </div>
            {myApplications.length > 3 ? (
              <Link
                href="/app/lamaran"
                className="text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
              >
                Lihat semua →
              </Link>
            ) : null}
          </div>
          <ol className="mt-6 divide-y divide-(--color-line) overflow-hidden rounded-lg border border-(--color-line) bg-(--color-paper)">
            {recentApplications.map((app) => {
              const job = jobs.find((j) => j.id === app.jobId);
              if (!job) return null;
              const isNew = isUpdatedSinceSeen(app);
              return (
                <li key={app.id}>
                  <Link
                    href={`/app/lamaran/${app.id}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 p-4 transition-colors hover:bg-(--color-tint) sm:p-5"
                  >
                    <span aria-hidden className="block">
                      {isNew ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-teal) opacity-50" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-teal)" />
                        </span>
                      ) : (
                        <span className="block h-2.5 w-2.5 rounded-full border border-(--color-line) bg-(--color-paper)" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-(--color-ink) sm:text-base">
                        {job.title}
                      </p>
                      <p className="truncate text-xs text-(--color-muted)">
                        {job.company} <span aria-hidden>·</span>{" "}
                        {formatRelativeId(
                          app.history[app.history.length - 1]?.at ?? app.createdAt,
                        )}
                      </p>
                    </div>
                    <StatusBadge status={app.status} size="sm" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

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
        <div className="mt-6 grid gap-4">
          {ranked.map(({ job, score, breakdown }) => {
            const top = breakdown.find((b) => b.state === "match");
            const reason = top
              ? `Cocok karena ${skillById[top.skillId]?.name ?? top.name}.`
              : "Lihat detail untuk rincian skor.";
            return (
              <JobCard
                key={job.id}
                job={job}
                matchScore={score}
                topReason={reason}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="next-heading">
        <h2
          id="next-heading"
          className="text-xl font-semibold tracking-tight text-(--color-ink)"
        >
          Langkah berikutnya untukmu
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <NextStep
            eyebrow="Assessment"
            title={`Ikuti tes ${assessments[0].title}`}
            body="10 soal, sekitar 12 menit. Skor kesiapanmu naik begitu selesai."
            href={`/app/assessment/${assessments[0].slug}`}
          />
          <NextStep
            eyebrow="Profil"
            title="Tambah pengalaman organisasi"
            body="Pengalaman organisasi memperkuat profil kandidat fresh graduate."
            href="/app/profil"
          />
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-(--color-ink)">
        {value}
      </p>
      {note && <p className="mt-0.5 text-xs text-(--color-muted)">{note}</p>}
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
      <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal)">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-base font-semibold text-(--color-ink) group-hover:text-(--color-teal)">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">{body}</p>
    </Link>
  );
}

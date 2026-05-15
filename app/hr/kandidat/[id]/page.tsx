import { notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ScoreDisplay from "@/components/ScoreDisplay";
import SkillBar from "@/components/SkillBar";
import HrActionPanel from "@/components/HrActionPanel";
import HrNotesPanel from "@/components/HrNotesPanel";
import {
  calcMatch,
  candidates,
  formatIdr,
  jobs,
  levelLabel,
  skillById,
} from "@/lib/mock-data";
import {
  autoTriggerReview,
  findApplication,
  listNotes,
} from "@/lib/applications-store";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ job?: string }>;

export default async function HrCandidateDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { job: jobIdParam } = await searchParams;
  const candidate = candidates.find((c) => c.id === id);
  if (!candidate) notFound();

  const job = jobIdParam
    ? jobs.find((j) => j.id === jobIdParam) ?? jobs[0]
    : jobs[0];

  // Auto-trigger review when HR opens a submitted application's detail.
  autoTriggerReview(candidate.id, job.id);

  const application = findApplication(candidate.id, job.id);
  const { score, breakdown } = calcMatch(candidate, job);
  const matchedSkills = breakdown.filter((b) => b.state === "match");
  const gapSkills = breakdown.filter((b) => b.state !== "match");

  const explanation = `Kandidat ini ${score >= 70 ? "siap kerja" : score >= 50 ? "trainable, butuh sedikit penguatan" : "masih jauh dari kebutuhan posisi"} untuk ${job.title}. ${matchedSkills.length} skill utama sudah cocok.`;

  const notes = application ? listNotes(application.id) : [];

  return (
    <AppShell variant="company" active="/hr/lowongan">
      <Link
        href={`/hr/lowongan/${job.id}`}
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
        Kembali ke kandidat untuk {job.title}
      </Link>

      <header className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
            Profil kandidat
          </p>
          <h1 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-(--color-ink)">
            {candidate.name}
          </h1>
          <p className="mt-1 text-sm text-(--color-muted)">
            {candidate.location} <span aria-hidden>·</span> {candidate.experienceYears} tahun pengalaman <span aria-hidden>·</span>{" "}
            {formatIdr(candidate.expectedSalary)} per bulan
          </p>
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <section className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
            <p className="text-xs text-(--color-muted)">
              Match score untuk posisi{" "}
              <Link
                href={`/hr/lowongan/${job.id}`}
                className="text-(--color-teal) hover:text-(--color-teal-deep)"
              >
                {job.title}
              </Link>
            </p>
            <div className="mt-3">
              <ScoreDisplay
                score={score}
                label="Match score"
                explanation={explanation}
                size="lg"
              />
            </div>

            <div className="mt-7">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
                Skill yang cocok ({matchedSkills.length})
              </h2>
              {matchedSkills.length === 0 ? (
                <p className="mt-3 text-sm text-(--color-muted)">
                  Tidak ada skill yang sepenuhnya memenuhi level yang diminta.
                </p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {matchedSkills.map((b) => (
                    <li
                      key={b.skillId}
                      className="flex items-center gap-2 rounded border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink)"
                    >
                      <span aria-hidden className="text-(--color-signal-green)">
                        ✓
                      </span>
                      <span className="flex-1">{b.name}</span>
                      <span className="text-xs text-(--color-muted)">
                        {levelLabel(b.have)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {gapSkills.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
                  Skill gap ({gapSkills.length})
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {gapSkills.map((b) => (
                    <li
                      key={b.skillId}
                      className="flex items-center gap-2 rounded border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink)"
                    >
                      <span
                        aria-hidden
                        className={
                          b.state === "improve"
                            ? "text-(--color-signal-amber)"
                            : "text-(--color-signal-clay)"
                        }
                      >
                        {b.state === "improve" ? "↑" : "—"}
                      </span>
                      <span className="flex-1">{b.name}</span>
                      <span className="text-xs text-(--color-muted)">
                        Diminta {levelLabel(b.required)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                  Kandidat ini bisa ditraining untuk menutup gap di atas.
                  Estimasi waktu belajar berdasarkan kursus yang
                  direkomendasikan: 1 sampai 3 minggu intensif.
                </p>
              </div>
            )}
          </section>

          <section className="mt-8 rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
              Tentang kandidat
            </h2>
            <p className="mt-3 text-base leading-relaxed text-(--color-ink)">
              {candidate.bio}
            </p>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
              Profil skill lengkap
            </h3>
            <div className="mt-4 space-y-4">
              {candidate.skills.map((s) => {
                const skill = skillById[s.skillId];
                if (!skill) return null;
                const req = job.requirements.find((r) => r.skillId === s.skillId);
                return (
                  <SkillBar
                    key={s.skillId}
                    name={skill.name}
                    level={s.level as 1 | 2 | 3}
                    required={req?.required}
                  />
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          {application ? (
            <HrActionPanel
              applicationId={application.id}
              status={application.status}
              rejectReason={application.rejectReason}
              candidateName={candidate.name}
              jobTitle={job.title}
            />
          ) : (
            <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5 text-sm leading-relaxed text-(--color-muted)">
              Kandidat ini belum melamar lowongan {job.title}. Mereka muncul
              di sini dari pool umum, bukan dari pipeline lamaran. Saat
              mereka melamar, kontrol status akan muncul di sini.
            </div>
          )}

          {application ? (
            <HrNotesPanel
              applicationId={application.id}
              rating={application.hrRating}
              notes={notes}
            />
          ) : null}

          <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
              Detail dasar
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Email" value={candidate.email} />
              <Row label="Lokasi" value={candidate.location} />
              <Row
                label="Pengalaman"
                value={`${candidate.experienceYears} tahun`}
              />
              <Row
                label="Ekspektasi gaji"
                value={formatIdr(candidate.expectedSalary)}
              />
              <Row
                label="Skor kesiapan"
                value={`${candidate.readinessScore}%`}
              />
            </dl>
          </div>

          <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5 text-sm leading-relaxed text-(--color-muted)">
            <p className="font-semibold text-(--color-ink)">
              Tentang skor ini
            </p>
            <p className="mt-2">
              Skor diperhitungkan otomatis dari skill, hasil assessment,
              pengalaman, lokasi, dan preferensi gaji kandidat dibanding
              kebutuhan posisi. Bukan algoritma kotak hitam: setiap komponen
              di atas bisa kamu telusuri.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-(--color-muted)">{label}</dt>
      <dd className="text-(--color-ink)">{value}</dd>
    </div>
  );
}

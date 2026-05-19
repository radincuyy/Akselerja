import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ApplyButton from "@/components/ApplyButton";
import CompanyLogo from "@/components/CompanyLogo";
import ScoreDisplay from "@/components/ScoreDisplay";
import { skillById } from "@/lib/skills";
import { calcMatch } from "@/lib/match";
import { buildMatchReason } from "@/lib/match-reason";
import { formatIdr, formatRelativeId } from "@/lib/format";
import { getJobByIdAsync } from "@/lib/jobs-store";
import { getCoursesForSkillsAsync } from "@/lib/courses-store";
import { getProfileOrSeedAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobByIdAsync(id);
  if (!job) {
    return { title: "Lowongan tidak ditemukan · Akselerja" };
  }
  const description =
    `${job.title} di ${job.company}, ${job.location}.` +
    (job.salaryMax > 0
      ? ` Gaji ${formatIdr(job.salaryMin)} - ${formatIdr(job.salaryMax)} per bulan.`
      : "");
  return {
    title: `${job.title} - ${job.company} · Akselerja`,
    description,
    openGraph: {
      title: `${job.title} di ${job.company}`,
      description,
      type: "article",
    },
  };
}

const TYPE_LABEL: Record<string, string> = {
  "Full-time": "Penuh Waktu",
  "Part-time": "Paruh Waktu",
  Kontrak: "Kontrak",
  Magang: "Magang",
};

const WORKMODE_LABEL: Record<string, string> = {
  onsite: "Kerja di lokasi",
  hybrid: "Hybrid",
  remote: "Remote",
};

const EDUCATION_LABEL: Record<string, string> = {
  "high school": "Minimal SMA/SMK",
  "associate degree": "Minimal Diploma",
  "professional certificate": "Minimal Diploma",
  "bachelor degree": "Minimal S1",
  "master degree": "Minimal S2",
  doctorate: "Minimal S3",
  "less than high school": "Tidak ada syarat pendidikan",
  PRIMARY_SCHOOL: "Minimal SD",
  SECONDARY_SCHOOL: "Minimal SMP",
  HIGH_SCHOOL: "Minimal SMA/SMK",
  DIPLOMA: "Minimal Diploma",
  PROFESSIONAL_EDUCATION: "Minimal Diploma",
  BACHELOR_DEGREE: "Minimal S1",
  MASTER_DEGREE: "Minimal S2",
  DOCTORATE: "Minimal S3",
};

const COMPANY_SIZE_LABEL: Record<string, string> = {
  BETWEEN_1_AND_10: "1 - 10 karyawan",
  BETWEEN_11_AND_50: "11 - 50 karyawan",
  BETWEEN_51_AND_200: "51 - 200 karyawan",
  BETWEEN_201_AND_500: "201 - 500 karyawan",
  BETWEEN_501_AND_1000: "501 - 1000 karyawan",
  BETWEEN_1001_AND_5000: "1001 - 5000 karyawan",
  MORE_THAN_5000: "5000+ karyawan",
};

function eduLabel(raw?: string): string | null {
  if (!raw) return null;
  return EDUCATION_LABEL[raw] ?? EDUCATION_LABEL[raw.toLowerCase()] ?? raw;
}

function experienceLabel(min?: number, max?: number): string | null {
  if (min == null && max == null) return null;
  if ((min ?? 0) === 0 && (max ?? 0) === 0) return "Fresh graduate";
  // Glints: "Pengalaman kurang dari 1 tahun" untuk 0-1 tahun
  if (min === 0 && max === 1) return "Pengalaman kurang dari 1 tahun";
  if (min != null && max != null) {
    if (min === max) return `Pengalaman ${min} tahun`;
    return `Pengalaman ${min} - ${max} tahun`;
  }
  if (min != null) return `Min. ${min} tahun pengalaman`;
  if (max != null) return `Maks. ${max} tahun pengalaman`;
  return null;
}

export default async function LowonganDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [job, me] = await Promise.all([
    getJobByIdAsync(id),
    getProfileOrSeedAsync(user.id),
  ]);
  if (!job) notFound();

  const { score, breakdown } = calcMatch(me, job);
  const matched = breakdown.filter((b) => b.state === "match");
  const missing = breakdown.filter((b) => b.state === "missing");
  const matchReason = buildMatchReason(me, job, { score, breakdown });

  const gapSkillIds = missing.map((b) => b.skillId);
  // Cap learning path to one course per gap skill so the four steps cover
  // the four most actionable gaps instead of repeating courses for the same
  // skill. We over-fetch then de-dupe by skillId to stay deterministic.
  const candidateCourses = await getCoursesForSkillsAsync(gapSkillIds);
  const seenSkill = new Set<string>();
  const learningPath: typeof candidateCourses = [];
  for (const c of candidateCourses) {
    if (seenSkill.has(c.skillId)) continue;
    seenSkill.add(c.skillId);
    learningPath.push(c);
    if (learningPath.length >= 4) break;
  }

  const explanation =
    score >= 75
      ? `Kamu sangat cocok untuk posisi ini. ${matched.length} skill utama sudah sesuai, dan tinggal ${missing.length} skill lagi yang bisa kamu pelajari untuk peluang lebih besar.`
      : score >= 50
        ? `Kamu cukup cocok untuk posisi ini, tapi ada beberapa skill kunci yang belum kamu miliki. Lihat rencana belajar di bawah.`
        : `Posisi ini agak jauh dari profil kamu sekarang. Tetap bisa kamu kejar, tapi butuh waktu di skill prioritas dulu.`;

  const typeLabel = TYPE_LABEL[job.type] ?? job.type;
  const workModeLabel = job.workMode ? WORKMODE_LABEL[job.workMode] ?? job.workMode : null;
  const educationLabel = eduLabel(job.minEducation);
  const expLabel = experienceLabel(job.minExperienceYears, job.maxExperienceYears);
  const companySizeLabel = job.companySize ? COMPANY_SIZE_LABEL[job.companySize] ?? null : null;

  return (
    <AppShell active="/app/lowongan">
      <Link
        href="/app/lowongan"
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
        Kembali ke daftar lowongan
      </Link>

      <header className="mt-6 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
          <CompanyLogo
            src={job.companyLogo}
            alt={job.company}
            size="lg"
            priority
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-[1.75rem] sm:leading-tight">
              {job.title}
            </h1>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-(--color-teal-deep)">
              {job.companyVerified ? (
                <span
                  aria-label="Perusahaan terverifikasi"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-(--color-signal-green) text-(--color-paper)"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path
                      d="M2 5l2 2 4-5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
              {job.company}
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-x-6 gap-y-2.5 text-sm text-(--color-ink) sm:grid-cols-2">
          {job.salaryMax > 0 ? (
            <li className="flex items-start gap-2 sm:col-span-2">
              <SalaryIcon />
              <span>
                <strong className="font-semibold">
                  {formatIdr(job.salaryMin)} – {formatIdr(job.salaryMax)}
                </strong>
                <span className="text-(--color-muted)">/Bulan</span>
                {job.bonusMax && job.bonusMax > 0 ? (
                  <span className="text-(--color-muted)">
                    {" · "}Bonus {formatIdr(job.bonusMin ?? 0)} – {formatIdr(job.bonusMax)}/bulan
                  </span>
                ) : null}
              </span>
            </li>
          ) : (
            <li className="flex items-start gap-2 text-(--color-muted) sm:col-span-2">
              <SalaryIcon />
              <span>Gaji tidak ditampilkan</span>
            </li>
          )}
          <li className="flex items-start gap-2 text-(--color-muted)">
            <BuildingIcon />
            <span>
              {job.industryId ? (
                job.industryBreadcrumb &&
                job.industryBreadcrumb.length >= 2 ? (
                  <>
                    {job.industryId}
                    <span className="mx-1.5" aria-hidden>›</span>
                    {job.industryBreadcrumb[job.industryBreadcrumb.length - 1]}
                  </>
                ) : (
                  job.industryId
                )
              ) : job.industryBreadcrumb && job.industryBreadcrumb.length >= 2 ? (
                <>
                  {job.industryBreadcrumb[0]}
                  <span className="mx-1.5" aria-hidden>›</span>
                  {job.industryBreadcrumb[job.industryBreadcrumb.length - 1]}
                </>
              ) : job.industryBreadcrumb && job.industryBreadcrumb.length === 1 ? (
                job.industryBreadcrumb[0]
              ) : (
                job.industry
              )}
            </span>
          </li>
          <li className="flex items-start gap-2 text-(--color-muted)">
            <ClockIcon />
            <span>
              {typeLabel}
              {workModeLabel ? ` · ${workModeLabel}` : ""}
            </span>
          </li>
          {educationLabel ? (
            <li className="flex items-start gap-2 text-(--color-muted)">
              <CapIcon />
              <span>{educationLabel}</span>
            </li>
          ) : null}
          {expLabel ? (
            <li className="flex items-start gap-2 text-(--color-muted)">
              <BriefcaseIcon />
              <span>{expLabel}</span>
            </li>
          ) : null}
        </ul>

        <p className="mt-5 text-xs text-(--color-muted)">
          Diposting {formatRelativeId(job.postedAt)}
          {job.status === "closed" ? " · Sudah ditutup" : ""}
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <section
            aria-labelledby="match-heading"
            className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7"
          >
            <ScoreDisplay
              score={score}
              label="Match score"
              explanation={explanation}
              size="lg"
            />

            {matchReason.positive || matchReason.negative ? (
              <div className="mt-6 space-y-2 rounded-md border border-(--color-line) bg-(--color-tint) p-4">
                {matchReason.positive ? (
                  <p className="flex items-start gap-2 text-sm leading-relaxed text-(--color-ink)">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-(--color-paper) text-(--color-signal-green)"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2 5l2 2 4-5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>{matchReason.positive}</span>
                  </p>
                ) : null}
                {matchReason.negative ? (
                  <p className="flex items-start gap-2 text-sm leading-relaxed text-(--color-muted)">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-(--color-paper) text-(--color-signal-clay)"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2.5 5h5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span>{matchReason.negative}</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-7 space-y-3">
              <h2
                id="match-heading"
                className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
              >
                Rincian kecocokan
              </h2>
              <ul className="divide-y divide-(--color-line) border-y border-(--color-line)">
                {breakdown.map((b) => (
                  <li
                    key={b.skillId}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StateBadge state={b.state} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-(--color-ink)">
                          {b.name}
                        </p>
                        <p className="text-xs text-(--color-muted)">
                          {b.state === "match"
                            ? "Sudah ada di profilmu"
                            : "Belum ada di profilmu"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-(--color-ink)">
                        +{b.contribution}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-(--color-muted)">
                        kontribusi
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="path-heading">
            <h2
              id="path-heading"
              className="text-lg font-semibold tracking-tight text-(--color-ink)"
            >
              Rencana belajar untuk posisi ini
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
              Empat langkah konkret yang langsung menutup skill gap di atas.
              Selesaikan satu per satu, match score-mu akan naik bersamaan.
            </p>

            {learningPath.length === 0 ? (
              <p className="mt-6 rounded-md border border-(--color-line) bg-(--color-tint) p-4 text-sm text-(--color-ink)">
                Profilmu sudah memenuhi semua skill yang diminta. Tidak ada
                kursus tambahan yang dibutuhkan untuk posisi ini.
              </p>
            ) : (
              <ol className="mt-6 space-y-3">
                {learningPath.map((c, i) => {
                  const targetSkill =
                    skillById[c.skillId]?.name ?? c.skillId;
                  return (
                    <li
                      key={c.id}
                      className="flex gap-4 rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-sm font-semibold text-(--color-teal)">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal-deep)">
                          Tutup gap {targetSkill}
                        </p>
                        <p className="mt-1 text-base font-semibold text-(--color-ink)">
                          {c.title}
                        </p>
                        <p className="mt-1 text-sm text-(--color-muted)">
                          {c.provider} · {c.durationHours} jam ·{" "}
                          {c.free ? "Gratis" : formatIdr(c.priceIdr ?? 0)}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                          {c.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="mt-8" aria-labelledby="desc-heading">
            <h2
              id="desc-heading"
              className="text-lg font-semibold tracking-tight text-(--color-ink)"
            >
              Tentang posisi ini
            </h2>
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-(--color-ink)">
              {job.description}
            </p>
          </section>

          {job.requirements.length > 0 ? (
            <section className="mt-8" aria-labelledby="skills-heading">
              <h2
                id="skills-heading"
                className="text-lg font-semibold tracking-tight text-(--color-ink)"
              >
                Skills
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {job.requirements.map((r) => (
                  <li key={r.skillId}>
                    <span className="inline-flex items-center rounded-full border border-(--color-line) bg-(--color-paper) px-3 py-1 text-sm text-(--color-ink)">
                      {r.name ?? skillById[r.skillId]?.name ?? r.skillId}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {job.benefits && job.benefits.length > 0 ? (
            <section className="mt-8" aria-labelledby="benefits-heading">
              <h2
                id="benefits-heading"
                className="text-lg font-semibold tracking-tight text-(--color-ink)"
              >
                Job Benefits
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {job.benefits.map((b) => (
                  <li key={b}>
                    <span className="inline-flex rounded-full border border-(--color-line) bg-(--color-paper) px-3 py-1 text-sm capitalize text-(--color-ink)">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            className="mt-8 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7"
            aria-labelledby="about-company-heading"
          >
            <h2
              id="about-company-heading"
              className="text-lg font-semibold tracking-tight text-(--color-ink)"
            >
              About the company
            </h2>
            <div className="mt-4 flex items-start gap-4">
              <CompanyLogo
                src={job.companyLogo}
                alt={job.company}
                size="md"
              />
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-teal-deep)">
                  {job.companyVerified ? (
                    <span
                      aria-label="Perusahaan terverifikasi"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-(--color-signal-green) text-(--color-paper)"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path
                          d="M2 5l2 2 4-5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                  {job.company}
                </p>
                <p className="mt-1 text-sm text-(--color-muted)">
                  {job.industryId ?? job.industryBreadcrumb?.[0] ?? job.industry}
                  {companySizeLabel ? ` · ${companySizeLabel}` : ""}
                </p>
                <CompanyLinks job={job} />
              </div>
            </div>
            {job.companyOverview ? (
              <div
                className="mt-6 space-y-3 text-sm leading-relaxed text-(--color-ink) [&_p]:my-3 [&_ul]:my-3 [&_ul]:ml-5 [&_ul]:list-disc [&_li]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0"
                dangerouslySetInnerHTML={{ __html: job.companyOverview }}
              />
            ) : null}
            {job.officeAddress ? (
              <>
                <h3 className="mt-6 text-sm font-semibold text-(--color-ink)">
                  Alamat kantor
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                  {job.officeAddress}
                </p>
              </>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          {job.status === "closed" ? (
            <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5 text-sm leading-relaxed text-(--color-muted)">
              <p className="font-semibold text-(--color-ink)">
                Lowongan ini sudah ditutup
              </p>
              <p className="mt-1">
                Perusahaan tidak menerima lamaran baru untuk posisi ini.
              </p>
              <Link
                href="/app/lowongan"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
              >
                Cari lowongan lain →
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
              <p className="text-sm leading-relaxed text-(--color-muted)">
                {score >= 50
                  ? "Kamu siap melamar. Klik tombol di bawah untuk melanjutkan ke halaman lamaran di Glints."
                  : "Kamu masih bisa melamar, tapi disarankan tutup beberapa skill gap dulu agar peluang lebih besar."}
              </p>
              <div className="mt-4">
                <ApplyButton applyUrl={job.applyUrl} />
              </div>
            </div>
          )}

          <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5 text-sm leading-relaxed text-(--color-muted)">
            <p className="font-semibold text-(--color-ink)">
              Bagaimana skor ini dihitung?
            </p>
            <p className="mt-2">
              Untuk tiap skill yang diminta, kami bandingkan level kamu dengan
              level yang dibutuhkan. Bobot tiap skill ditetapkan saat lowongan
              diposting. Skill yang cocok memberi kontribusi positif; skill yang
              belum cocok menjadi langkah berikutnya untuk kamu kerjakan.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function CompanyLinks({
  job,
}: {
  job: {
    companyWebsite?: string;
    companyInstagramUrl?: string;
    companyFacebookUrl?: string;
    companyLinkedInUrl?: string;
  };
}) {
  const links = [
    job.companyWebsite ? { href: job.companyWebsite, label: "Website", icon: <GlobeIcon /> } : null,
    job.companyInstagramUrl
      ? { href: job.companyInstagramUrl, label: "Instagram", icon: <InstagramIcon /> }
      : null,
    job.companyFacebookUrl
      ? { href: job.companyFacebookUrl, label: "Facebook", icon: <FacebookIcon /> }
      : null,
    job.companyLinkedInUrl
      ? { href: job.companyLinkedInUrl, label: "LinkedIn", icon: <LinkedInIcon /> }
      : null,
  ].filter((l): l is NonNullable<typeof l> => Boolean(l));
  if (links.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--color-line) text-(--color-muted) transition-colors hover:border-(--color-teal) hover:text-(--color-teal)"
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}

function StateBadge({ state }: { state: "match" | "missing" }) {
  const config = {
    match: {
      label: "Sudah ada",
      cls: "bg-(--color-tint) text-(--color-signal-green)",
      icon: (
        <path
          d="M3 7l3 3 5-6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    missing: {
      label: "Belum ada",
      cls: "bg-(--color-tint) text-(--color-signal-clay)",
      icon: (
        <path
          d="M3 7h8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      ),
    },
  }[state];

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.cls}`}
      aria-label={config.label}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        {config.icon}
      </svg>
    </span>
  );
}

function SalaryIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-(--color-muted)">
      <path
        d="M8 1v14M11 4H6.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
      <rect x="3" y="2" width="10" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 4.5h1m3 0h1m-5 3h1m3 0h1m-5 3h1m3 0h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
      <path
        d="M5 1v3M11 1v3M2.5 6.5h11M3 4h10a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-8A.5.5 0 0 1 3 4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
      <path d="M1.5 6 8 3l6.5 3L8 9 1.5 6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4 7.5v3c0 1 1.8 1.5 4 1.5s4-.5 4-1.5v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
      <rect x="2" y="5" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 5V3.5A.5.5 0 0 1 6.5 3h3a.5.5 0 0 1 .5.5V5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 9h12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M1.5 7h11M7 1.5c1.7 2 1.7 9 0 11M7 1.5c-1.7 2-1.7 9 0 11"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="2" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="4" r="0.6" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M8.5 12.5V8.5h1.7l.3-2H8.5V5.4c0-.6.2-1 1-1h1V2.6c-.2 0-.8-.1-1.6-.1-1.6 0-2.7.9-2.7 2.7v1.3H4.5v2h1.7v4h2.3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5 6v4M5 4.4v.1M7 10V6m0 1.5c.4-1 1.2-1.5 2-1.5 1.1 0 1.5.7 1.5 2V10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

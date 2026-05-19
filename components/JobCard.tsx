import Link from "next/link";
import type { Job } from "@/lib/types";
import { formatIdr, scoreBandLabel } from "@/lib/format";
import CompanyLogo from "@/components/CompanyLogo";

type Props = {
  job: Job;
  matchScore: number;
  topReason?: string;
  reason?: { positive: string; negative: string };
  ctaPath?: string;
};

const EDUCATION_LABEL: Record<string, string> = {
  HIGH_SCHOOL: "SMA/SMK",
  DIPLOMA: "D1-D4",
  PROFESSIONAL_EDUCATION: "Diploma",
  BACHELOR_DEGREE: "S1",
  MASTER_DEGREE: "S2",
  DOCTORATE: "S3",
  SECONDARY_SCHOOL: "SMP",
  PRIMARY_SCHOOL: "SD",
};

function matchTone(score: number) {
  if (score >= 75) return "text-(--color-teal)";
  if (score >= 50) return "text-(--color-signal-amber)";
  return "text-(--color-signal-clay)";
}

function eduChipLabel(raw?: string): string | null {
  if (!raw) return null;
  return EDUCATION_LABEL[raw] ?? null;
}

export default function JobCard({
  job,
  matchScore,
  topReason,
  reason,
  ctaPath,
}: Props) {
  const href = ctaPath ?? `/app/lowongan/${job.id}`;
  const eduChip = eduChipLabel(job.minEducation);
  const skillNames = (job.requirements ?? [])
    .map((r) => r.name ?? r.skillId)
    .filter((n, i, a) => n && a.indexOf(n) === i);
  const visibleSkills = skillNames.slice(0, 3);
  const moreSkills = skillNames.length - visibleSkills.length;

  return (
    <article className="group rounded-lg border border-(--color-line) bg-(--color-paper) p-5 transition-colors hover:border-(--color-ink)/40 sm:p-6">
      <Link href={href} className="block">
        <div className="flex gap-4">
          <CompanyLogo src={job.companyLogo} alt={job.company} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold tracking-tight text-(--color-ink) group-hover:text-(--color-teal)">
                  {job.title}
                </h3>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-(--color-muted)">
                  {job.companyVerified ? (
                    <span
                      aria-label="Perusahaan terverifikasi"
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-(--color-signal-green) text-(--color-paper)"
                    >
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
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
                  <span className="truncate">{job.company}</span>
                  <span aria-hidden>·</span>
                  <span className="truncate">{job.location}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span
                    className={`text-2xl font-semibold leading-none tabular-nums ${matchTone(matchScore)}`}
                  >
                    {matchScore}
                  </span>
                  <span className="text-sm text-(--color-muted)">%</span>
                </div>
                <p className="text-xs font-medium text-(--color-muted)">
                  {scoreBandLabel(matchScore, "candidate")}
                </p>
              </div>
            </div>

            {visibleSkills.length > 0 || job.type || eduChip ? (
              <ul className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip>{job.type}</Chip>
                {eduChip ? <Chip muted>Min. {eduChip}</Chip> : null}
                {visibleSkills.map((s) => (
                  <Chip key={s} muted>
                    {s}
                  </Chip>
                ))}
                {moreSkills > 0 ? <Chip muted>+{moreSkills}</Chip> : null}
              </ul>
            ) : null}

            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <span className="text-sm font-medium text-(--color-ink)">
                {job.salaryMax > 0
                  ? `${formatIdr(job.salaryMin)} – ${formatIdr(job.salaryMax)}/bulan`
                  : "Gaji tidak ditampilkan"}
              </span>
            </div>

            {reason && (reason.positive || reason.negative) ? (
              <div className="mt-3 space-y-1.5 border-t border-(--color-line) pt-3">
                {reason.positive ? (
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-(--color-ink)">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-(--color-signal-green)"
                    >
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2 5l2 2 4-5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>{reason.positive}</span>
                  </p>
                ) : null}
                {reason.negative ? (
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-(--color-muted)">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-(--color-signal-clay)"
                    >
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2.5 5h5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    <span>{reason.negative}</span>
                  </p>
                ) : null}
              </div>
            ) : topReason ? (
              <p className="mt-3 text-xs text-(--color-muted)">{topReason}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

function Chip({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  if (!children) return null;
  return (
    <li>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${
          muted
            ? "bg-(--color-tint) text-(--color-muted)"
            : "bg-(--color-tint) text-(--color-teal-deep)"
        }`}
      >
        {children}
      </span>
    </li>
  );
}

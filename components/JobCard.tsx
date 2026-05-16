import Link from "next/link";
import type { Job } from "@/lib/types";
import { formatIdr, scoreBandLabel } from "@/lib/format";

type Props = {
  job: Job;
  matchScore: number;
  topReason?: string;
  ctaPath?: string;
};

function matchTone(score: number) {
  if (score >= 75) return "text-(--color-teal)";
  if (score >= 50) return "text-(--color-signal-amber)";
  return "text-(--color-signal-clay)";
}

export default function JobCard({ job, matchScore, topReason, ctaPath }: Props) {
  const href = ctaPath ?? `/app/lowongan/${job.id}`;
  return (
    <article className="group rounded-lg border border-(--color-line) bg-(--color-paper) p-5 transition-colors hover:border-(--color-ink)/40 sm:p-6">
      <Link href={href} className="block">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-(--color-ink) group-hover:text-(--color-teal)">
              {job.title}
            </h3>
            <p className="mt-0.5 text-sm text-(--color-muted)">
              {job.company} · {job.location}
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
            <p className={`text-xs font-medium ${matchTone(matchScore)}`}>
              {scoreBandLabel(matchScore)}
            </p>
          </div>
        </div>

        {topReason && (
          <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
            {topReason}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-(--color-muted)">
          <span className="font-medium text-(--color-ink)">
            {formatIdr(job.salaryMin)} – {formatIdr(job.salaryMax)}
          </span>
          <span>{job.type}</span>
          <span>{job.industry}</span>
        </div>
      </Link>
    </article>
  );
}

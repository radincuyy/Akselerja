import { notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import CandidateSearchInput from "@/components/CandidateSearchInput";
import {
  calcMatch,
  candidates,
  formatIdr,
  formatRelativeId,
  jobs,
  skillById,
} from "@/lib/mock-data";
import {
  listApplicationsForJob,
  statusGroup,
} from "@/lib/applications-store";
import { closeJobAction, reopenJobAction } from "@/lib/job-actions";
import { scoreBandLabel } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ status?: string; q?: string }>;

type StatusFilter = "all" | "submitted" | "reviewing" | "invited" | "closed";

const FILTERS: Array<{
  id: StatusFilter;
  label: string;
}> = [
  { id: "all", label: "Semua" },
  { id: "submitted", label: "Belum direview" },
  { id: "reviewing", label: "Direview" },
  { id: "invited", label: "Diundang" },
  { id: "closed", label: "Selesai" },
];

function matchesFilter(status: ApplicationStatus, f: StatusFilter): boolean {
  if (f === "all") return true;
  if (f === "closed") return statusGroup(status) === "closed";
  return status === f;
}

export default async function HrJobCandidatesPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { status: statusParam, q } = await searchParams;
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const activeFilter: StatusFilter =
    (FILTERS.find((f) => f.id === statusParam)?.id as StatusFilter) ?? "all";
  const search = (q ?? "").trim().toLowerCase();

  const apps = listApplicationsForJob(job.id);
  const enriched = apps
    .map((app) => {
      const cand = candidates.find((c) => c.id === app.candidateId);
      if (!cand) return null;
      const { score, breakdown } = calcMatch(cand, job);
      return { app, candidate: cand, score, breakdown };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const counts: Record<StatusFilter, number> = {
    all: enriched.length,
    submitted: enriched.filter((e) => e.app.status === "submitted").length,
    reviewing: enriched.filter((e) => e.app.status === "reviewing").length,
    invited: enriched.filter((e) => e.app.status === "invited").length,
    closed: enriched.filter((e) => statusGroup(e.app.status) === "closed").length,
  };

  const filtered = enriched
    .filter((e) => matchesFilter(e.app.status, activeFilter))
    .filter((e) => !search || e.candidate.name.toLowerCase().includes(search))
    .sort((a, b) => b.score - a.score);

  return (
    <AppShell variant="company" active="/hr/lowongan">
      <Link
        href="/hr/lowongan"
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

      <header className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <p className="text-sm font-medium text-(--color-muted)">
            {job.industry} <span aria-hidden>·</span> {job.type}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-(--color-muted)">
            {job.location} <span aria-hidden>·</span>{" "}
            {formatIdr(job.salaryMin)} – {formatIdr(job.salaryMax)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/hr/lowongan/${job.id}/edit`}
            className="rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
          >
            Edit lowongan
          </Link>
          {job.status === "closed" ? (
            <form action={reopenJobAction.bind(null, job.id)}>
              <button
                type="submit"
                className="rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
              >
                Buka kembali
              </button>
            </form>
          ) : (
            <form action={closeJobAction.bind(null, job.id)}>
              <button
                type="submit"
                className="rounded-md border border-(--color-line) bg-(--color-paper) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-signal-clay) hover:text-(--color-signal-clay)"
              >
                Tutup lowongan
              </button>
            </form>
          )}
        </div>
      </header>

      {job.status === "closed" ? (
        <div
          role="status"
          className="mt-6 flex flex-col gap-1 rounded-lg border border-(--color-line) bg-(--color-tint) p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-(--color-ink)">
              Lowongan ini sudah ditutup
            </p>
            <p className="mt-0.5 text-xs text-(--color-muted)">
              Kandidat baru tidak bisa melamar. Pelamar lama tetap bisa kamu kelola.
              {job.closedAt
                ? ` Ditutup ${formatRelativeId(job.closedAt)}.`
                : ""}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter status pipeline" className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const isActive = f.id === activeFilter;
            const params = new URLSearchParams();
            if (f.id !== "all") params.set("status", f.id);
            if (search) params.set("q", search);
            const qs = params.toString();
            const href = `/hr/lowongan/${job.id}${qs ? `?${qs}` : ""}`;
            return (
              <Link
                key={f.id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "inline-flex min-h-11 items-center rounded-full bg-(--color-teal) px-4 py-2 text-xs font-medium text-(--color-paper-on-teal)"
                    : "inline-flex min-h-11 items-center rounded-full border border-(--color-line) bg-(--color-paper) px-4 py-2 text-xs font-medium text-(--color-muted) hover:border-(--color-ink)/40 hover:text-(--color-ink)"
                }
              >
                {f.label}
                <span className={isActive ? "ml-1.5 opacity-80" : "ml-1.5"}>
                  {counts[f.id]}
                </span>
              </Link>
            );
          })}
        </nav>
        <CandidateSearchInput initial={search} />
      </div>

      {enriched.length === 0 ? (
        <EmptyJobState />
      ) : filtered.length === 0 ? (
        <SearchEmpty filter={activeFilter} search={search} jobId={job.id} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-(--color-line) bg-(--color-paper)">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Daftar kandidat untuk {job.title}, diurutkan dari match score tertinggi.
            </caption>
            <thead className="bg-(--color-tint) text-xs uppercase tracking-wider text-(--color-muted)">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Kandidat
                </th>
                <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">
                  Match
                </th>
                <th scope="col" className="hidden px-5 py-3 font-medium md:table-cell">
                  Status
                </th>
                <th scope="col" className="hidden px-5 py-3 font-medium lg:table-cell">
                  Skill cocok
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-line)">
              {filtered.map(({ app, candidate: c, score, breakdown }) => {
                const matchedNames = breakdown
                  .filter((b) => b.state === "match")
                  .slice(0, 3)
                  .map((b) => skillById[b.skillId]?.name ?? b.name);
                return (
                  <tr key={c.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-(--color-ink)">{c.name}</p>
                      <p className="text-xs text-(--color-muted)">
                        {c.location} <span aria-hidden>·</span>{" "}
                        {c.experienceYears} thn{" "}
                        <span aria-hidden>·</span> {formatIdr(c.expectedSalary)}
                      </p>
                      <p className="mt-1 text-[11px] text-(--color-muted)">
                        Lamar {formatRelativeId(app.createdAt)}
                      </p>
                    </td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <ScoreCell score={score} />
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {matchedNames.length === 0 ? (
                        <span className="text-xs text-(--color-muted)">
                          Lihat detail untuk skill gap
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {matchedNames.map((n) => (
                            <span
                              key={n}
                              className="rounded-full bg-(--color-tint) px-2 py-0.5 text-xs text-(--color-ink)"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/hr/kandidat/${c.id}?job=${job.id}`}
                        className="text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
                      >
                        Lihat →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function ScoreCell({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "text-(--color-teal)"
      : score >= 50
        ? "text-(--color-signal-amber)"
        : "text-(--color-signal-clay)";
  const fill =
    score >= 75
      ? "h-full bg-(--color-teal)"
      : score >= 50
        ? "h-full bg-(--color-signal-amber)"
        : "h-full bg-(--color-signal-clay)";
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className={`text-base font-semibold tabular-nums ${tone}`}>
          {score}%
        </span>
        <span className={`text-xs font-medium ${tone}`}>
          {scoreBandLabel(score)}
        </span>
      </div>
      <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-(--color-line)">
        <div className={fill} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function EmptyJobState() {
  return (
    <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-paper) p-8">
      <p className="text-sm font-semibold text-(--color-ink)">
        Belum ada kandidat untuk posisi ini
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
        Lowongan baru biasanya butuh 3 sampai 7 hari sebelum kandidat pertama
        masuk. Sambil menunggu, cek apakah deskripsi lowongan cukup spesifik
        soal skill yang dibutuhkan; semakin jelas, semakin tepat sasaran.
      </p>
    </section>
  );
}

function SearchEmpty({
  filter,
  search,
  jobId,
}: {
  filter: StatusFilter;
  search: string;
  jobId: string;
}) {
  return (
    <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-tint) p-6">
      <p className="text-sm leading-relaxed text-(--color-muted)">
        {search
          ? `Tidak ada kandidat dengan nama mengandung “${search}”${filter !== "all" ? " di status ini" : ""}.`
          : `Tidak ada kandidat di status ini.`}
      </p>
      <Link
        href={`/hr/lowongan/${jobId}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
      >
        Lihat semua kandidat →
      </Link>
    </section>
  );
}

import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  isUpdatedSinceSeen,
  listApplicationsForCandidate,
} from "@/lib/applications-store";
import { formatRelativeId, jobs, me, calcMatch } from "@/lib/mock-data";
import type { ApplicationStatus } from "@/lib/types";

type Filter = "all" | "open" | "invited" | "closed";

const FILTERS: Array<{ id: Filter; label: string; statuses: ApplicationStatus[] | "all" }> = [
  { id: "all", label: "Semua", statuses: "all" },
  {
    id: "open",
    label: "Sedang berjalan",
    statuses: ["submitted", "reviewing"],
  },
  { id: "invited", label: "Diundang interview", statuses: ["invited"] },
  { id: "closed", label: "Selesai", statuses: ["accepted", "rejected"] },
];

type SearchParams = Promise<{ filter?: string }>;

export default async function LamaranListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { filter: filterParam } = await searchParams;
  const activeFilter: Filter =
    (FILTERS.find((f) => f.id === filterParam)?.id as Filter) ?? "all";

  const all = listApplicationsForCandidate(me.id);
  const counts: Record<Filter, number> = {
    all: all.length,
    open: all.filter((a) => a.status === "submitted" || a.status === "reviewing").length,
    invited: all.filter((a) => a.status === "invited").length,
    closed: all.filter((a) => a.status === "accepted" || a.status === "rejected").length,
  };

  const filtered = all.filter((a) => {
    const f = FILTERS.find((x) => x.id === activeFilter)!;
    return f.statuses === "all" || f.statuses.includes(a.status);
  });

  const newCount = all.filter((a) => isUpdatedSinceSeen(a)).length;

  return (
    <AppShell variant="candidate" active="/app/lamaran">
      <PageHeader
        eyebrow="Lamaran"
        title="Lamaran kamu"
        description={
          newCount > 0
            ? `Ada ${newCount} lamaran dengan status baru sejak terakhir kamu lihat. Buka untuk lihat detailnya.`
            : "Pantau status tiap lamaran. Saat status berubah, kamu akan melihat tanda baru di item yang berubah."
        }
      />

      <nav aria-label="Filter status" className="mt-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const isActive = f.id === activeFilter;
          const count = counts[f.id];
          const href = f.id === "all" ? "/app/lamaran" : `/app/lamaran?filter=${f.id}`;
          return (
            <Link
              key={f.id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "rounded-full bg-(--color-teal) px-3.5 py-1.5 text-xs font-medium text-(--color-paper-on-teal)"
                  : "rounded-full border border-(--color-line) bg-(--color-paper) px-3.5 py-1.5 text-xs font-medium text-(--color-muted) hover:border-(--color-ink)/40 hover:text-(--color-ink)"
              }
            >
              {f.label}
              <span className={isActive ? "ml-1.5 opacity-80" : "ml-1.5"}>
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <EmptyState filter={activeFilter} hasAny={all.length > 0} />
      ) : (
        <ol className="mt-8 divide-y divide-(--color-line) overflow-hidden rounded-lg border border-(--color-line) bg-(--color-paper)">
          {filtered.map((app) => {
            const job = jobs.find((j) => j.id === app.jobId);
            if (!job) return null;
            const isNew = isUpdatedSinceSeen(app);
            const currentScore = calcMatch(me, job).score;
            const drift = currentScore - app.scoreAtApply;
            return (
              <li key={app.id}>
                <Link
                  href={`/app/lamaran/${app.id}`}
                  className="grid grid-cols-[auto_1fr_auto] items-start gap-x-4 gap-y-2 p-5 transition-colors hover:bg-(--color-tint) sm:p-6"
                >
                  <span aria-hidden className="mt-2">
                    {isNew ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full pulse-once rounded-full bg-(--color-teal) opacity-50" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-teal)" />
                      </span>
                    ) : (
                      <span className="block h-2.5 w-2.5 rounded-full border border-(--color-line) bg-(--color-paper)" />
                    )}
                    <span className="sr-only">{isNew ? "Update baru" : "Tidak ada update"}</span>
                  </span>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-(--color-ink) sm:text-lg">
                      {job.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-(--color-muted)">
                      {job.company} <span aria-hidden>·</span> {job.location}
                    </p>
                    <p className="mt-2 text-xs text-(--color-muted)">
                      Dilamar {formatRelativeId(app.createdAt)} pada skor {app.scoreAtApply}%
                      {drift !== 0 ? (
                        <span className={drift > 0 ? "text-(--color-signal-green)" : "text-(--color-signal-clay)"}>
                          {" "}
                          ({drift > 0 ? "+" : ""}
                          {drift} sekarang)
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={app.status} size="sm" />
                    <span className="text-[11px] text-(--color-muted)">
                      Update {formatRelativeId(app.history[app.history.length - 1]?.at ?? app.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-8 max-w-xl text-xs leading-relaxed text-(--color-muted)">
        Status di sini sama dengan yang dilihat HR. Kalau ada perubahan, kami
        tandai dengan titik berdenyut sampai kamu buka detailnya.
      </p>
    </AppShell>
  );
}

function EmptyState({
  filter,
  hasAny,
}: {
  filter: Filter;
  hasAny: boolean;
}) {
  if (!hasAny) {
    return (
      <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-paper) p-8 sm:p-10">
        <p className="text-sm font-semibold text-(--color-ink)">Belum ada lamaran</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
          Lamaran pertamamu mulai dari rekomendasi pekerjaan. Pilih satu yang
          skornya paling tinggi, baca rincian kecocokan, lalu lamar dengan
          satu klik.
        </p>
        <Link
          href="/app/lowongan"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
        >
          Lihat rekomendasi pekerjaan
        </Link>
      </section>
    );
  }
  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? "ini";
  return (
    <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-tint) p-6">
      <p className="text-sm leading-relaxed text-(--color-muted)">
        Belum ada lamaran dengan status &ldquo;{filterLabel}&rdquo;. Coba filter
        &ldquo;Semua&rdquo; untuk melihat semua lamaranmu.
      </p>
      <Link
        href="/app/lamaran"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
      >
        Lihat semua →
      </Link>
    </section>
  );
}

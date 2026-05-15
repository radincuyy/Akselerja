import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/JobCard";
import { jobs, me, calcMatch, skillById } from "@/lib/mock-data";

export default function LowonganListPage() {
  const ranked = jobs
    .map((job) => ({ job, ...calcMatch(me, job) }))
    .sort((a, b) => b.score - a.score);

  return (
    <AppShell variant="candidate" active="/app/lowongan">
      <PageHeader
        eyebrow="Lowongan"
        title="Lowongan yang cocok denganmu"
        description={`Diurutkan berdasarkan match score, dari yang paling cocok. Setiap lowongan menampilkan satu alasan kecocokan dan, kalau ada, satu skill yang masih perlu kamu tingkatkan.`}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <FilterChip label="Semua lokasi" active />
        <FilterChip label="Bekasi" />
        <FilterChip label="Jakarta" />
        <FilterChip label="Tangerang" />
        <span aria-hidden className="h-4 w-px bg-(--color-line)" />
        <FilterChip label="Full-time" active />
        <FilterChip label="Magang" />
        <FilterChip label="Kontrak" />
      </div>

      <div className="mt-8 grid gap-4">
        {ranked.map(({ job, score, breakdown }) => {
          const top = breakdown.find((b) => b.state === "match");
          const reason = top
            ? `Cocok karena ${skillById[top.skillId]?.name ?? top.name}.`
            : "Beberapa skill belum cocok, lihat detail.";
          return (
            <JobCard key={job.id} job={job} matchScore={score} topReason={reason} />
          );
        })}
      </div>
    </AppShell>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-(--color-teal) px-3.5 py-1.5 text-xs font-medium text-(--color-paper-on-teal)"
          : "rounded-full border border-(--color-line) bg-(--color-paper) px-3.5 py-1.5 text-xs font-medium text-(--color-muted) hover:border-(--color-ink)/40 hover:text-(--color-ink)"
      }
    >
      {label}
    </button>
  );
}

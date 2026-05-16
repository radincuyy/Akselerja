import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/JobCard";
import { jobs, me, calcMatch, skillById } from "@/lib/mock-data";

type SearchParams = Promise<{ lokasi?: string; tipe?: string }>;

const TIPE_OPTIONS = ["Full-time", "Part-time", "Kontrak", "Magang"] as const;

function shortCity(location: string): string {
  // "Bekasi, Jawa Barat" -> "Bekasi"
  return location.split(",")[0].trim();
}

export default async function LowonganListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { lokasi, tipe } = await searchParams;
  const open = jobs.filter((j) => j.status !== "closed");

  const lokasiOptions = Array.from(
    new Set(open.map((j) => shortCity(j.location))),
  ).sort();

  const filtered = open.filter((j) => {
    if (lokasi && shortCity(j.location).toLowerCase() !== lokasi.toLowerCase()) {
      return false;
    }
    if (tipe && j.type !== tipe) return false;
    return true;
  });

  const ranked = filtered
    .map((job) => ({ job, ...calcMatch(me, job) }))
    .sort((a, b) => b.score - a.score);

  function buildHref(next: { lokasi?: string | null; tipe?: string | null }) {
    const params = new URLSearchParams();
    const nextLokasi = next.lokasi === undefined ? lokasi : next.lokasi;
    const nextTipe = next.tipe === undefined ? tipe : next.tipe;
    if (nextLokasi) params.set("lokasi", nextLokasi);
    if (nextTipe) params.set("tipe", nextTipe);
    const qs = params.toString();
    return qs ? `/app/lowongan?${qs}` : "/app/lowongan";
  }

  const hasFilter = Boolean(lokasi || tipe);

  return (
    <AppShell variant="candidate" active="/app/lowongan">
      <PageHeader
        eyebrow="Lowongan"
        title="Lowongan yang cocok denganmu"
        description="Diurutkan berdasarkan match score, dari yang paling cocok. Setiap lowongan menampilkan satu alasan kecocokan dan, kalau ada, satu skill yang masih perlu kamu tingkatkan."
      />

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <FilterChip
          label="Semua lokasi"
          active={!lokasi}
          href={buildHref({ lokasi: null })}
        />
        {lokasiOptions.map((loc) => (
          <FilterChip
            key={loc}
            label={loc}
            active={lokasi?.toLowerCase() === loc.toLowerCase()}
            href={buildHref({ lokasi: loc })}
          />
        ))}
        <span aria-hidden className="mx-1 h-4 w-px bg-(--color-line)" />
        <FilterChip
          label="Semua tipe"
          active={!tipe}
          href={buildHref({ tipe: null })}
        />
        {TIPE_OPTIONS.map((t) => (
          <FilterChip
            key={t}
            label={t}
            active={tipe === t}
            href={buildHref({ tipe: t })}
          />
        ))}
      </div>

      {ranked.length === 0 ? (
        <EmptyResult hasFilter={hasFilter} />
      ) : (
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
      )}
    </AppShell>
  );
}

function FilterChip({
  label,
  active,
  href,
}: {
  label: string;
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex min-h-11 items-center rounded-full bg-(--color-teal) px-4 py-2 text-xs font-medium text-(--color-paper-on-teal)"
          : "inline-flex min-h-11 items-center rounded-full border border-(--color-line) bg-(--color-paper) px-4 py-2 text-xs font-medium text-(--color-muted) hover:border-(--color-ink)/40 hover:text-(--color-ink)"
      }
    >
      {label}
    </Link>
  );
}

function EmptyResult({ hasFilter }: { hasFilter: boolean }) {
  return (
    <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-tint) p-8">
      <p className="text-sm font-semibold text-(--color-ink)">
        {hasFilter
          ? "Tidak ada lowongan yang cocok dengan filter ini"
          : "Belum ada lowongan terbuka"}
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
        {hasFilter
          ? "Coba longgarkan filter, atau lihat semua lowongan terlebih dahulu."
          : "Pengen tetap diberi tahu? Pastikan profilmu lengkap supaya bisa dicocokkan saat lowongan baru masuk."}
      </p>
      {hasFilter ? (
        <Link
          href="/app/lowongan"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
        >
          Lihat semua lowongan →
        </Link>
      ) : null}
    </section>
  );
}

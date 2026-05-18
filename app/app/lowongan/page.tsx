import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/JobCard";
import JobSearchInput from "@/components/JobSearchInput";
import JobFilterSheet from "@/components/JobFilterSheet";
import { skillById } from "@/lib/skills";
import { calcMatch } from "@/lib/match";
import { listCityFacetsAsync, searchJobs } from "@/lib/search-store";
import { getProfileOrSeedAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";

type SearchParams = Promise<{
  lokasi?: string;
  tipe?: string;
  q?: string;
  pengalaman?: string;
  pendidikan?: string;
  gaji?: string;
  page?: string;
}>;

const PAGE_SIZE = 20;

function parseExperience(
  v: string | undefined,
): { experienceMin?: number; experienceMax?: number } {
  if (!v) return {};
  switch (v) {
    case "0":
    case "fresh":
      return { experienceMin: 0, experienceMax: 0 };
    case "0-1":
      return { experienceMin: 0, experienceMax: 1 };
    case "1-3":
      return { experienceMin: 1, experienceMax: 3 };
    case "3-5":
      return { experienceMin: 3, experienceMax: 5 };
    case "5-10":
      return { experienceMin: 5, experienceMax: 10 };
    case "10+":
      return { experienceMin: 10 };
    default:
      return {};
  }
}

function parseSalary(
  v: string | undefined,
): { salaryMinFloor?: number; salaryMaxCeiling?: number } {
  if (!v) return {};
  const M = 1_000_000;
  switch (v) {
    case "0-3":
      return { salaryMaxCeiling: 3 * M };
    case "3-5":
      return { salaryMinFloor: 3 * M, salaryMaxCeiling: 5 * M };
    case "5-10":
      return { salaryMinFloor: 5 * M, salaryMaxCeiling: 10 * M };
    case "10-20":
      return { salaryMinFloor: 10 * M, salaryMaxCeiling: 20 * M };
    case "20+":
      return { salaryMinFloor: 20 * M };
    default:
      return {};
  }
}

export default async function LowonganListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const { lokasi, tipe, q, pengalaman, pendidikan, gaji, page } = sp;
  const user = await requireUser();
  const me = await getProfileOrSeedAsync(user.id);

  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const top = pageNum * PAGE_SIZE;

  // City facets are scoped by the active type filter so the count next to a
  // city reflects what the user will actually see if they pick it.
  const [{ jobs, relevance, fromSearch, totalCount }, cityFacets] =
    await Promise.all([
      searchJobs({
        query: q,
        city: lokasi || undefined,
        type: tipe || undefined,
        education: pendidikan || undefined,
        ...parseExperience(pengalaman),
        ...parseSalary(gaji),
        includeClosed: false,
        top,
        skip: 0,
        profileVector: me.profileVector,
      }),
      listCityFacetsAsync({ type: tipe || undefined }),
    ]);

  const semanticActive = Boolean(me.profileVector?.length) && fromSearch;

  const hasQuery = Boolean(q && q.trim());
  const ranked = jobs
    .map((job) => {
      const m = calcMatch(me, job);
      const lexical = relevance[job.id] ?? 0;
      const composite = hasQuery
        ? m.score * 0.6 + Math.min(lexical, 5) * 8
        : m.score;
      return { job, ...m, composite };
    })
    .sort((a, b) => b.composite - a.composite);

  const hasFilter = Boolean(
    lokasi || tipe || q || pengalaman || pendidikan || gaji,
  );
  const total = totalCount ?? ranked.length;
  const hasMore = ranked.length < total;

  function buildPageHref(nextPage: number): string {
    const params = new URLSearchParams();
    if (lokasi) params.set("lokasi", lokasi);
    if (tipe) params.set("tipe", tipe);
    if (q) params.set("q", q);
    if (pengalaman) params.set("pengalaman", pengalaman);
    if (pendidikan) params.set("pendidikan", pendidikan);
    if (gaji) params.set("gaji", gaji);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/app/lowongan?${qs}` : "/app/lowongan";
  }

  return (
    <AppShell active="/app/lowongan">
      <PageHeader
        eyebrow="Lowongan"
        title="Lowongan yang cocok denganmu"
        description={
          hasQuery
            ? `Hasil pencarian untuk "${q}", diurutkan menggabungkan relevansi kata kunci dan match score skillmu.`
            : "Diurutkan berdasarkan match score, dari yang paling cocok. Setiap lowongan menampilkan satu alasan kecocokan dan, kalau ada, satu skill yang masih perlu kamu tingkatkan."
        }
      />

      <div className="mt-8 max-w-2xl">
        <JobSearchInput defaultValue={q ?? ""} />
        {fromSearch ? (
          <p className="mt-2 text-xs text-(--color-muted)">
            {semanticActive
              ? "Pencarian semantik berdasarkan profilmu, ditenagai Azure AI Search."
              : "Pencarian ditenagai Azure AI Search."}
          </p>
        ) : null}
      </div>

      <div className="mt-6 lg:hidden">
        <JobFilterSheet
          cities={cityFacets}
          defaultCity={lokasi ?? ""}
          defaultType={tipe ?? ""}
          defaultExperience={pengalaman ?? ""}
          defaultEducation={pendidikan ?? ""}
          defaultSalary={gaji ?? ""}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[18rem_1fr] lg:gap-8 lg:items-start">
        <div className="hidden lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-5rem)]">
          <JobFilterSheet
            cities={cityFacets}
            defaultCity={lokasi ?? ""}
            defaultType={tipe ?? ""}
            defaultExperience={pengalaman ?? ""}
            defaultEducation={pendidikan ?? ""}
            defaultSalary={gaji ?? ""}
          />
        </div>

        <div className="min-w-0">
          {ranked.length === 0 ? (
            <EmptyResult hasFilter={hasFilter} />
          ) : (
            <>
              <p className="mb-4 text-sm text-(--color-muted)">
                Menampilkan {ranked.length} dari {total} lowongan
                {lokasi ? ` di ${lokasi}` : ""}
                {tipe ? ` · ${tipe}` : ""}
              </p>
              <div className="grid gap-4">
                {ranked.map(({ job, score, breakdown }) => {
                  const top = breakdown.find((b) => b.state === "match");
                  const reason = top
                    ? `Cocok karena ${skillById[top.skillId]?.name ?? top.name}.`
                    : "Beberapa skill belum cocok, lihat detail.";
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

              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <Link
                    href={buildPageHref(pageNum + 1)}
                    className="inline-flex h-11 items-center rounded-full border border-(--color-line) bg-(--color-paper) px-6 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)/40"
                  >
                    Lihat lebih banyak ({total - ranked.length} sisa)
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function EmptyResult({ hasFilter }: { hasFilter: boolean }) {
  return (
    <section className="mt-10 rounded-lg border border-(--color-line) bg-(--color-tint) p-8">
      <p className="text-sm font-semibold text-(--color-ink)">
        {hasFilter
          ? "Tidak ada lowongan yang cocok dengan pencarian ini"
          : "Belum ada lowongan terbuka"}
      </p>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
        {hasFilter
          ? "Coba longgarkan filter atau hapus kata kunci, lalu lihat semua lowongan."
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

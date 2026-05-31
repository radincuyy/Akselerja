import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/JobCard";
import JobSearchInput from "@/components/JobSearchInput";
import JobFilterSheet from "@/components/JobFilterSheet";
import Pagination from "@/components/Pagination";
import { calcMatch } from "@/lib/jobs/match";
import { buildMatchReason } from "@/lib/jobs/match-reason";
import { listCityFacetsAsync } from "@/lib/jobs/search-store";
import { rankedJobsSlice } from "@/lib/jobs/ranked-jobs";
import { getCurrentCandidate } from "@/lib/profile/current-candidate";
import { expandIndustryGroups } from "@/lib/shared/preferences-options";

type SearchParams = Promise<{
  lokasi?: string;
  tipe?: string;
  industri?: string;
  mode?: string;
  q?: string;
  pengalaman?: string;
  pendidikan?: string;
  gaji?: string;
  page?: string;
}>;

const PAGE_SIZE = 20;

function csvList(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseExperience(
  v: string | undefined,
): { experienceMin?: number; experienceMax?: number } {
  if (!v) return {};
  switch (v) {
    case "fresh":
      return { experienceMin: 0, experienceMax: 1 };
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
  const { lokasi, tipe, industri, mode, q, pengalaman, pendidikan, gaji, page } = sp;
  const { profile: me } = await getCurrentCandidate();

  const lokasiList = csvList(lokasi);
  const tipeList = csvList(tipe);
  const industriList = csvList(industri);
  const modeList = csvList(mode);

  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const searchParamsForRank = {
    query: q,
    cities: lokasiList.length > 0 ? lokasiList : undefined,
    types: tipeList.length > 0 ? tipeList : undefined,
    industryIds:
      industriList.length > 0
        ? expandIndustryGroups(industriList)
        : undefined,
    workModes: modeList.length > 0 ? modeList : undefined,
    education: pendidikan || undefined,
    ...parseExperience(pengalaman),
    ...parseSalary(gaji),
    includeClosed: false,
  };

  const [
    { jobs, scoresById, lexicalById, totalCount, fromSearch, fromFallback },
    cityFacets,
  ] = await Promise.all([
    rankedJobsSlice({
      candidate: me,
      params: searchParamsForRank,
      page: pageNum,
      pageSize: PAGE_SIZE,
    }),
    listCityFacetsAsync({ types: tipeList.length > 0 ? tipeList : undefined }),
  ]);

  const hasQuery = Boolean(q && q.trim());
  const ranked = jobs.map((job) => {
    const m = calcMatch(me, job);
    const cachedScore = scoresById[job.id];
    const lexical = lexicalById[job.id] ?? 0;
    return {
      job,
      ...m,
      score: cachedScore ?? m.score,
      lexical,
    };
  });

  const hasFilter = Boolean(
    lokasiList.length ||
      tipeList.length ||
      industriList.length ||
      modeList.length ||
      q ||
      pengalaman ||
      pendidikan ||
      gaji,
  );
  const RANK_POOL_CAP = 500;
  const total = Math.min(totalCount ?? ranked.length, RANK_POOL_CAP);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(pageNum, totalPages);
  const hasSkills = (me.skills?.length ?? 0) > 0;

  function buildPageHref(nextPage: number): string {
    const params = new URLSearchParams();
    if (lokasiList.length > 0) params.set("lokasi", lokasiList.join(","));
    if (tipeList.length > 0) params.set("tipe", tipeList.join(","));
    if (industriList.length > 0) params.set("industri", industriList.join(","));
    if (modeList.length > 0) params.set("mode", modeList.join(","));
    if (q) params.set("q", q);
    if (pengalaman) params.set("pengalaman", pengalaman);
    if (pendidikan) params.set("pendidikan", pendidikan);
    if (gaji) params.set("gaji", gaji);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/app/lowongan?${qs}` : "/app/lowongan";
  }

  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = (currentPage - 1) * PAGE_SIZE + ranked.length;

  return (
    <>
      <PageHeader
        eyebrow="Lowongan"
        title="Lowongan yang cocok denganmu"
        description={
          hasQuery
            ? `Hasil pencarian untuk "${q}", diurutkan dari match score paling tinggi.`
            : "Diurutkan berdasarkan match score, dari yang paling cocok. Setiap lowongan menampilkan satu alasan kecocokan dan, kalau ada, satu skill yang masih perlu kamu tingkatkan."
        }
      />

      <div className="mt-8 max-w-2xl">
        <JobSearchInput defaultValue={q ?? ""} />
        {fromSearch && hasSkills && !hasQuery ? (
          <p className="mt-2 text-xs text-(--color-muted)">
            Pencarian semantik berdasarkan profilmu, jadi urutan menyesuaikan
            kekuatan skill yang sudah kamu masukkan.
          </p>
        ) : null}
        {hasQuery ? (
          <p className="mt-2 text-xs text-(--color-muted)">
            Hanya lowongan yang cocok dengan kata kunci, diurutkan dari match
            score tertinggi.
          </p>
        ) : null}
      </div>

      {fromFallback ? (
        <div
          role="status"
          className="mt-6 max-w-2xl rounded-lg border border-(--color-signal-amber)/40 bg-(--color-tint) p-4 text-sm text-(--color-ink)"
        >
          <p className="font-semibold">Pencarian sedang dalam mode dasar</p>
          <p className="mt-1 text-(--color-muted)">
            Mesin pencarian utama sedang tidak responsif, jadi urutan saat ini
            tidak menggunakan ranking semantik. Refresh dalam beberapa saat
            untuk mencoba lagi.
          </p>
        </div>
      ) : null}

      {!hasSkills ? (
        <div className="mt-6 max-w-2xl rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
          <p className="text-sm font-semibold text-(--color-ink)">
            Urutan masih generic
          </p>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Lowongan di bawah belum disesuaikan dengan profilmu. Lengkapi skill
            atau upload CV supaya urutannya benar-benar mencerminkan kecocokan.
          </p>
          <Link
            href={me.cv ? "/app/profil" : "/app/profil/cv"}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
          >
            {me.cv ? "Lengkapi profil" : "Upload CV"} →
          </Link>
        </div>
      ) : null}

      <div className="mt-6 lg:hidden">
        <JobFilterSheet
          cities={cityFacets}
          defaultCities={lokasiList}
          defaultTypes={tipeList}
          defaultIndustries={industriList}
          defaultModes={modeList}
          defaultExperience={pengalaman ?? ""}
          defaultEducation={pendidikan ?? ""}
          defaultSalary={gaji ?? ""}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[18rem_1fr] lg:gap-8 lg:items-start">
        <div className="hidden lg:sticky lg:top-16 lg:block">
          <JobFilterSheet
            cities={cityFacets}
            defaultCities={lokasiList}
            defaultTypes={tipeList}
            defaultIndustries={industriList}
            defaultModes={modeList}
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
                Menampilkan {rangeStart}–{rangeEnd} dari {total} lowongan
                {lokasiList.length > 0 ? ` di ${lokasiList.join(", ")}` : ""}
                {tipeList.length > 0 ? ` · ${tipeList.join(", ")}` : ""}
              </p>
              <div className="grid gap-4">
                {ranked.map(({ job, score, breakdown }) => {
                  const reason = buildMatchReason(me, job, { score, breakdown });
                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      matchScore={score}
                      reason={reason}
                    />
                  );
                })}
              </div>

              <Pagination
                className="mt-8"
                currentPage={currentPage}
                totalPages={totalPages}
                hrefForPage={buildPageHref}
                label="lowongan"
              />
            </>
          )}
        </div>
      </div>
    </>
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

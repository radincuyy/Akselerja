import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import JobCard from "@/components/JobCard";
import JobSearchInput from "@/components/JobSearchInput";
import JobFilterSheet from "@/components/JobFilterSheet";
import { calcMatch } from "@/lib/match";
import { buildMatchReason } from "@/lib/match-reason";
import { listCityFacetsAsync, searchJobs } from "@/lib/search-store";
import { getProfileOrSeedAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";

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
  clear?: string;
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
  const { lokasi, tipe, industri, mode, q, pengalaman, pendidikan, gaji, page, clear } = sp;
  const user = await requireUser();
  const me = await getProfileOrSeedAsync(user.id);

  const lokasiList = csvList(lokasi);
  const tipeList = csvList(tipe);
  const industriList = csvList(industri);
  const modeList = csvList(mode);

  const hasAnyParam = Boolean(
    lokasi || tipe || industri || mode || pengalaman || pendidikan || gaji || q,
  );
  if (clear !== "1" && !hasAnyParam) {
    const params = new URLSearchParams();
    if (me.preferredCities && me.preferredCities.length > 0) {
      params.set("lokasi", me.preferredCities.join(","));
    }
    if (me.preferredJobTypes && me.preferredJobTypes.length > 0) {
      params.set("tipe", me.preferredJobTypes.join(","));
    }
    if (me.preferredWorkModes && me.preferredWorkModes.length > 0) {
      params.set("mode", me.preferredWorkModes.join(","));
    }
    if (me.industries && me.industries.length > 0) {
      params.set("industri", me.industries.join(","));
    }
    if ([...params.keys()].length > 0) {
      redirect(`/app/lowongan?${params.toString()}`);
    }
  }

  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const top = pageNum * PAGE_SIZE;

  const [{ jobs, relevance, fromSearch, fromFallback, totalCount }, cityFacets] =
    await Promise.all([
      searchJobs({
        query: q,
        cities: lokasiList.length > 0 ? lokasiList : undefined,
        types: tipeList.length > 0 ? tipeList : undefined,
        industryIds: industriList.length > 0 ? industriList : undefined,
        workModes: modeList.length > 0 ? modeList : undefined,
        education: pendidikan || undefined,
        ...parseExperience(pengalaman),
        ...parseSalary(gaji),
        includeClosed: false,
        top,
        skip: 0,
        profileVector: me.profileVector,
      }),
      listCityFacetsAsync({ types: tipeList.length > 0 ? tipeList : undefined }),
    ]);

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
    lokasi || tipe || industri || mode || q || pengalaman || pendidikan || gaji,
  );
  const total = totalCount ?? ranked.length;
  const hasMore = ranked.length < total;
  const hasSkills = (me.skills?.length ?? 0) > 0;

  function buildPageHref(nextPage: number): string {
    const params = new URLSearchParams();
    if (lokasi) params.set("lokasi", lokasi);
    if (tipe) params.set("tipe", tipe);
    if (industri) params.set("industri", industri);
    if (mode) params.set("mode", mode);
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
        {fromSearch && hasSkills ? (
          <p className="mt-2 text-xs text-(--color-muted)">
            Pencarian semantik berdasarkan profilmu, jadi urutan menyesuaikan
            kekuatan skill yang sudah kamu masukkan.
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
                Menampilkan {ranked.length} dari {total} lowongan
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

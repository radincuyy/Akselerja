import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { unstable_cache } from "next/cache";
import type { Job } from "../shared/types";
import { getJobsByIdsAsync, listJobsAsync } from "./jobs-store";

const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const KEY = process.env.AZURE_SEARCH_KEY;
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_JOBS ?? "jobs-v1";

function isSearchConfigured(): boolean {
  return Boolean(ENDPOINT && KEY);
}

let _client: SearchClient<IndexedJob> | null = null;
function getClient(): SearchClient<IndexedJob> {
  if (!_client) {
    _client = new SearchClient<IndexedJob>(
      ENDPOINT!,
      INDEX_NAME,
      new AzureKeyCredential(KEY!),
    );
  }
  return _client;
}

type IndexedJob = {
  id: string;
  title: string;
  company: string;
  description: string;
  industry: string;
  industryId?: string | null;
  location: string;
  city: string;
  skillIds: string[];
  salaryMin: number;
  salaryMax: number;
  type: string;
  workMode?: string | null;
  status: "open" | "closed";
  postedAt: string;
  companyId: string;
  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
  minEducation?: string | null;
  descriptionVector?: number[];
};

export type SearchJobsParams = {
  query?: string;
  cities?: string[];
  types?: string[];
  industryIds?: string[];
  workModes?: string[];
  skillIds?: string[];
  experienceMin?: number;
  experienceMax?: number;
  education?: string;
  salaryMinFloor?: number;
  salaryMaxCeiling?: number;
  includeClosed?: boolean;
  top?: number;
  skip?: number;
  profileVector?: number[];
};

export type SearchJobsResult = {
  jobs: Job[];
  relevance: Record<string, number>;
  fromSearch: boolean;
  fromFallback?: boolean;
  totalCount?: number;
};

function escapeOdataString(s: string): string {
  return s.replace(/'/g, "''");
}

function buildFilter(params: SearchJobsParams): string | undefined {
  const clauses: string[] = [];
  if (!params.includeClosed) {
    clauses.push("status eq 'open'");
  }
  if (params.cities && params.cities.length > 0) {
    const csv = params.cities
      .map((s) => escapeOdataString(s))
      .join(",");
    clauses.push(`search.in(city, '${csv}', ',')`);
  }
  if (params.types && params.types.length > 0) {
    const csv = params.types
      .map((s) => escapeOdataString(s))
      .join(",");
    clauses.push(`search.in(type, '${csv}', ',')`);
  }
  if (params.industryIds && params.industryIds.length > 0) {
    const csv = params.industryIds
      .map((s) => escapeOdataString(s))
      .join(",");
    clauses.push(`search.in(industryId, '${csv}', ',')`);
  }
  if (params.workModes && params.workModes.length > 0) {
    const csv = params.workModes
      .map((s) => escapeOdataString(s))
      .join(",");
    clauses.push(`search.in(workMode, '${csv}', ',')`);
  }
  if (params.skillIds && params.skillIds.length > 0) {
    const escaped = params.skillIds
      .map((s) => escapeOdataString(s))
      .join(",");
    clauses.push(`skillIds/any(s: search.in(s, '${escaped}', ','))`);
  }
  if (typeof params.salaryMinFloor === "number") {
    clauses.push(`salaryMax ge ${params.salaryMinFloor}`);
  }
  if (typeof params.salaryMaxCeiling === "number") {
    clauses.push(`salaryMin gt 0 and salaryMin le ${params.salaryMaxCeiling}`);
  }
  if (typeof params.experienceMin === "number") {
    clauses.push(
      `(maxExperienceYears ge ${params.experienceMin} or minExperienceYears ge ${params.experienceMin})`,
    );
  }
  if (typeof params.experienceMax === "number") {
    clauses.push(
      `(minExperienceYears le ${params.experienceMax} or minExperienceYears eq null)`,
    );
  }
  if (params.education) {
    clauses.push(
      `minEducation eq '${escapeOdataString(params.education)}'`,
    );
  }
  return clauses.length === 0 ? undefined : clauses.join(" and ");
}

export async function hydrateJobs(ids: string[]): Promise<Map<string, Job>> {
  if (ids.length === 0) return new Map();
  const jobs = await getJobsByIdsAsync(ids);
  return new Map(jobs.map((j) => [j.id, j]));
}

async function fallbackSearch(
  params: SearchJobsParams,
): Promise<SearchJobsResult> {
  const all = await listJobsAsync();
  const filtered = all.filter((j) => applyJobFilter(j, params));
  const relevance: Record<string, number> = {};
  for (const j of filtered) relevance[j.id] = 1;
  const top = params.top ?? 50;
  const skip = params.skip ?? 0;
  return {
    jobs: filtered.slice(skip, skip + top),
    relevance,
    fromSearch: false,
    totalCount: filtered.length,
  };
}

function applyJobFilter(j: Job, params: SearchJobsParams): boolean {
  if (!params.includeClosed && j.status === "closed") return false;
  if (params.cities && params.cities.length > 0) {
    const jobCity = j.location.split(",")[0].trim().toLowerCase();
    const wanted = params.cities.map((c) => c.toLowerCase());
    if (!wanted.includes(jobCity)) return false;
  }
  if (params.types && params.types.length > 0) {
    if (!params.types.includes(j.type)) return false;
  }
  if (params.industryIds && params.industryIds.length > 0) {
    if (!j.industryId || !params.industryIds.includes(j.industryId)) {
      return false;
    }
  }
  if (params.workModes && params.workModes.length > 0) {
    const mode = j.workMode ?? "onsite";
    if (!params.workModes.includes(mode)) return false;
  }
  if (params.skillIds && params.skillIds.length > 0) {
    const have = new Set(j.requirements.map((r) => r.skillId));
    if (!params.skillIds.some((s) => have.has(s))) return false;
  }
  if (params.education && j.minEducation) {
    if (j.minEducation !== params.education) return false;
  }
  if (typeof params.experienceMin === "number") {
    const max = j.maxExperienceYears ?? j.minExperienceYears ?? 0;
    if (max < params.experienceMin) return false;
  }
  if (typeof params.experienceMax === "number") {
    const min = j.minExperienceYears ?? 0;
    if (min > params.experienceMax) return false;
  }
  if (typeof params.salaryMinFloor === "number") {
    if (!j.salaryMax || j.salaryMax < params.salaryMinFloor) return false;
  }
  if (typeof params.salaryMaxCeiling === "number") {
    if (!j.salaryMin || j.salaryMin > params.salaryMaxCeiling) return false;
  }
  if (params.query && params.query.trim()) {
    const q = params.query.toLowerCase();
    const hay =
      `${j.title} ${j.company} ${j.description} ${j.industry} ${j.location}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function shortCity(location: string): string {
  return location.split(",")[0].trim();
}

export async function searchJobs(
  params: SearchJobsParams = {},
): Promise<SearchJobsResult> {
  if (!isSearchConfigured()) {
    return fallbackSearch(params);
  }
  const client = getClient();
  const top = params.top ?? 50;
  const skip = params.skip ?? 0;
  const hydrateHeadroom = Math.min(20, Math.max(3, Math.ceil(top * 0.25)));
  const fetchSize = top + hydrateHeadroom;
  const knnPool = Math.max(top * 2 + skip, 200);
  const filter = buildFilter({
    cities: params.cities,
    types: params.types,
    industryIds: params.industryIds,
    workModes: params.workModes,
    skillIds: params.skillIds,
    salaryMinFloor: params.salaryMinFloor,
    salaryMaxCeiling: params.salaryMaxCeiling,
    experienceMin: params.experienceMin,
    experienceMax: params.experienceMax,
    education: params.education,
    includeClosed: params.includeClosed,
  });
  const searchText =
    params.query && params.query.trim().length > 0 ? params.query : "*";
  const hasVector =
    Array.isArray(params.profileVector) && params.profileVector.length > 0;

  try {
    const response = await client.search(searchText, {
      filter,
      top: fetchSize,
      skip,
      includeTotalCount: true,
      queryType: "simple",
      searchFields: ["title", "company", "description", "industry", "location"],
      vectorSearchOptions: hasVector
        ? {
            queries: [
              {
                kind: "vector",
                vector: params.profileVector!,
                kNearestNeighborsCount: knnPool,
                fields: ["descriptionVector"],
              },
            ],
          }
        : undefined,
    });

    const ids: string[] = [];
    const relevance: Record<string, number> = {};
    for await (const result of response.results) {
      const doc = result.document;
      ids.push(doc.id);
      relevance[doc.id] = result.score ?? 0;
    }
    const hydrated = await hydrateJobs(ids);
    const ordered = ids
      .map((id) => hydrated.get(id))
      .filter((j): j is Job => Boolean(j));
    const totalCount =
      typeof response.count === "number" ? response.count : ordered.length;
    const page = ordered.slice(0, top);
    return { jobs: page, relevance, fromSearch: true, totalCount };
  } catch (err) {
    console.error("[search] AI Search query failed, falling back:", err);
    const result = await fallbackSearch(params);
    return { ...result, fromFallback: true };
  }
}

const JOB_FACETS_TAG = "job-facets";

export async function listCityFacetsAsync(
  filter: { types?: string[] } = {},
): Promise<{ value: string; count: number }[]> {
  const typesKey = (filter.types ?? []).join(",");
  const cacheKey = ["city-facets", typesKey];
  const fetcher = unstable_cache(
    async (csvTypes: string): Promise<{ value: string; count: number }[]> => {
      const types = csvTypes ? csvTypes.split(",").filter(Boolean) : [];
      if (!isSearchConfigured()) {
        const jobs = await listJobsAsync();
        const counts = new Map<string, number>();
        for (const j of jobs) {
          if (j.status === "closed") continue;
          if (types.length > 0 && !types.includes(j.type)) continue;
          const city = j.location.split(",")[0].trim();
          if (!city) continue;
          counts.set(city, (counts.get(city) ?? 0) + 1);
        }
        return [...counts.entries()]
          .map(([value, count]) => ({ value, count }))
          .sort(
            (a, b) => b.count - a.count || a.value.localeCompare(b.value),
          );
      }
      const client = getClient();
      const filterClauses = ["status eq 'open'"];
      if (types.length > 0) {
        const csv = types.map((t) => escapeOdataString(t)).join(",");
        filterClauses.push(`search.in(type, '${csv}', ',')`);
      }
      const response = await client.search("*", {
        facets: ["city,count:200"],
        filter: filterClauses.join(" and "),
        top: 0,
        includeTotalCount: false,
      });
      const cityFacet = response.facets?.["city"];
      if (!cityFacet) return [];
      return cityFacet
        .map((f) => ({
          value: String(f.value),
          count: typeof f.count === "number" ? f.count : 0,
        }))
        .filter((f) => f.value)
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    },
    cacheKey,
    {
      tags: [JOB_FACETS_TAG],
      revalidate: 3600,
    },
  );
  return fetcher(typesKey);
}

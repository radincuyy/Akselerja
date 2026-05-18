import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { unstable_cache } from "next/cache";
import type { Job } from "./types";
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
  location: string;
  city: string;
  skillIds: string[];
  salaryMin: number;
  salaryMax: number;
  type: string;
  status: "open" | "closed";
  postedAt: string;
  companyId: string;
  descriptionVector?: number[];
};

export type SearchJobsParams = {
  query?: string;
  city?: string;
  type?: string;
  industry?: string;
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
  if (params.city) {
    clauses.push(`city eq '${escapeOdataString(params.city)}'`);
  }
  if (params.type) {
    clauses.push(`type eq '${escapeOdataString(params.type)}'`);
  }
  if (params.industry) {
    clauses.push(`industry eq '${escapeOdataString(params.industry)}'`);
  }
  if (params.skillIds && params.skillIds.length > 0) {
    const list = params.skillIds
      .map((s) => `'${escapeOdataString(s)}'`)
      .join(", ");
    clauses.push(`skillIds/any(s: search.in(s, ${list}))`);
  }
  if (typeof params.salaryMinFloor === "number") {
    clauses.push(`salaryMax ge ${params.salaryMinFloor}`);
  }
  if (typeof params.salaryMaxCeiling === "number") {
    clauses.push(`salaryMin gt 0 and salaryMin le ${params.salaryMaxCeiling}`);
  }
  return clauses.length === 0 ? undefined : clauses.join(" and ");
}

async function hydrateJobs(ids: string[]): Promise<Map<string, Job>> {
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
  if (params.city) {
    const city = j.location.split(",")[0].trim().toLowerCase();
    if (city !== params.city.toLowerCase()) return false;
  }
  if (params.type && j.type !== params.type) return false;
  if (params.industry && j.industry !== params.industry) return false;
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
  const hasClientFilter =
    typeof params.experienceMin === "number" ||
    typeof params.experienceMax === "number" ||
    Boolean(params.education);
  const fetchSize = hasClientFilter
    ? Math.min(500, Math.max(top + skip, 200))
    : Math.min(200, top + skip + 20);
  const filter = buildFilter({
    city: params.city,
    type: params.type,
    industry: params.industry,
    skillIds: params.skillIds,
    salaryMinFloor: params.salaryMinFloor,
    salaryMaxCeiling: params.salaryMaxCeiling,
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
      includeTotalCount: false,
      queryType: "simple",
      searchFields: ["title", "company", "description", "industry", "location"],
      vectorSearchOptions: hasVector
        ? {
            queries: [
              {
                kind: "vector",
                vector: params.profileVector!,
                kNearestNeighborsCount: Math.max(fetchSize * 2, 100),
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
    const filtered = ordered.filter((j) => applyJobFilter(j, params));
    const totalCount = filtered.length;
    const page = filtered.slice(skip, skip + top);
    return { jobs: page, relevance, fromSearch: true, totalCount };
  } catch (err) {
    console.error("[search] AI Search query failed, falling back:", err);
    return fallbackSearch(params);
  }
}

export const JOB_FACETS_TAG = "job-facets";

export async function listCityFacetsAsync(
  filter: { type?: string } = {},
): Promise<{ value: string; count: number }[]> {
  const cacheKey = ["city-facets", filter.type ?? ""];
  const fetcher = unstable_cache(
    async (typeFilter: string): Promise<{ value: string; count: number }[]> => {
      if (!isSearchConfigured()) {
        const jobs = await listJobsAsync();
        const counts = new Map<string, number>();
        for (const j of jobs) {
          if (j.status === "closed") continue;
          if (typeFilter && j.type !== typeFilter) continue;
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
      if (typeFilter) {
        filterClauses.push(`type eq '${escapeOdataString(typeFilter)}'`);
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
  return fetcher(filter.type ?? "");
}

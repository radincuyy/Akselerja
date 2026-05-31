"use server";

import { createHash } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { searchJobs, hydrateJobs, type SearchJobsParams } from "./search-store";
import { calcMatch } from "./match";
import type { Candidate, Job } from "../shared/types";

const CANDIDATE_POOL = 500;
const CACHE_TTL_SECONDS = 60;

export type RankedEntry = {
  jobId: string;
  score: number;
  lexical: number;
};

type RankedListMeta = {
  ranked: RankedEntry[];
  totalCount: number;
  fromSearch: boolean;
  fromFallback: boolean;
};

export type RankedSlice = {
  jobs: Job[];
  scoresById: Record<string, number>;
  lexicalById: Record<string, number>;
  totalCount: number;
  fromSearch: boolean;
  fromFallback: boolean;
};

function rankCacheTag(userId: string): string {
  return `ranked-jobs:${userId}`;
}

function filtersHash(params: SearchJobsParams): string {
  const norm = {
    q: params.query ?? "",
    cities: [...(params.cities ?? [])].sort(),
    types: [...(params.types ?? [])].sort(),
    industryIds: [...(params.industryIds ?? [])].sort(),
    workModes: [...(params.workModes ?? [])].sort(),
    skillIds: [...(params.skillIds ?? [])].sort(),
    salaryMinFloor: params.salaryMinFloor ?? null,
    salaryMaxCeiling: params.salaryMaxCeiling ?? null,
    experienceMin: params.experienceMin ?? null,
    experienceMax: params.experienceMax ?? null,
    education: params.education ?? null,
    includeClosed: Boolean(params.includeClosed),
  };
  return createHash("sha1")
    .update(JSON.stringify(norm))
    .digest("hex")
    .slice(0, 16);
}

async function buildRankedList(
  candidate: Candidate,
  params: SearchJobsParams,
): Promise<RankedListMeta> {
  const hasQuery = Boolean(params.query && params.query.trim());
  const result = await searchJobs({
    ...params,
    top: CANDIDATE_POOL,
    skip: 0,
    profileVector: hasQuery ? undefined : candidate.profileVector,
  });
  const ranked: RankedEntry[] = result.jobs.map((job) => {
    const m = calcMatch(candidate, job);
    const lexical = result.relevance[job.id] ?? 0;
    return { jobId: job.id, score: m.score, lexical };
  });
  ranked.sort((a, b) => b.score - a.score);
  return {
    ranked,
    totalCount: hasQuery ? ranked.length : (result.totalCount ?? ranked.length),
    fromSearch: result.fromSearch,
    fromFallback: Boolean(result.fromFallback),
  };
}

export async function rankedJobsSlice({
  candidate,
  params,
  page,
  pageSize,
}: {
  candidate: Candidate;
  params: SearchJobsParams;
  page: number;
  pageSize: number;
}): Promise<RankedSlice> {
  const userId = candidate.id;
  const fHash = filtersHash(params);

  const fetcher = unstable_cache(
    async (uid: string, hash: string): Promise<RankedListMeta> => {
      void uid;
      void hash;
      return buildRankedList(candidate, params);
    },
    ["ranked-jobs-meta", userId, fHash],
    {
      tags: [rankCacheTag(userId)],
      revalidate: CACHE_TTL_SECONDS,
    },
  );

  const built = await fetcher(userId, fHash);
  const start = Math.max(0, (page - 1) * pageSize);
  const slice = built.ranked.slice(start, start + pageSize);
  const ids = slice.map((r) => r.jobId);
  const hydrated = await hydrateJobs(ids);
  const orderedJobs = ids
    .map((id) => hydrated.get(id))
    .filter((j): j is Job => Boolean(j));
  const scoresById: Record<string, number> = {};
  const lexicalById: Record<string, number> = {};
  for (const r of slice) {
    scoresById[r.jobId] = r.score;
    lexicalById[r.jobId] = r.lexical;
  }
  return {
    jobs: orderedJobs,
    scoresById,
    lexicalById,
    totalCount: built.totalCount,
    fromSearch: built.fromSearch,
    fromFallback: built.fromFallback,
  };
}

export async function invalidateRankedJobs(userId: string): Promise<void> {
  revalidateTag(rankCacheTag(userId));
}

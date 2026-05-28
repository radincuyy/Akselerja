import type { Candidate, Job } from "./types";
import { calcMatch, type MatchResult } from "./match";
import { searchJobs, type SearchJobsResult } from "./search-store";

export type RankedJob = {
  job: Job;
  score: number;
  breakdown: MatchResult["breakdown"];
  dimensions: MatchResult["dimensions"];
};

export type RankCandidateJobsOptions = {
  top?: number;
  fallbackOnEmpty?: boolean;
  filterPositiveScore?: boolean;
};

export type RankCandidateJobsResult = {
  ranked: RankedJob[];
  fromFallback: boolean;
  search: SearchJobsResult;
};

export async function rankCandidateJobs(
  profile: Candidate,
  options: RankCandidateJobsOptions = {},
): Promise<RankCandidateJobsResult> {
  const top = options.top ?? 12;
  const userSkillIds = profile.skills?.map((s) => s.skillId) ?? [];
  const initial = await searchJobs({
    top,
    profileVector: profile.profileVector,
    skillIds: userSkillIds.length > 0 ? userSkillIds : undefined,
    includeClosed: false,
  });
  let search = initial;
  let fromFallback = false;
  if (
    options.fallbackOnEmpty &&
    initial.jobs.length === 0 &&
    userSkillIds.length > 0
  ) {
    search = await searchJobs({
      top,
      profileVector: profile.profileVector,
      includeClosed: false,
    });
    fromFallback = true;
  }
  const ranked = search.jobs
    .map((job) => ({ job, ...calcMatch(profile, job) }))
    .filter((r) => (options.filterPositiveScore ? r.score > 0 : true))
    .sort((a, b) => b.score - a.score);
  return { ranked, fromFallback, search };
}

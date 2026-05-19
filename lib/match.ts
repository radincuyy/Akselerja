import type { Candidate, Job, SkillRequirement } from "./types";
import { skillById } from "./skills";

type SkillState = "match" | "missing";

type MatchBreakdownItem = {
  skillId: string;
  name: string;
  state: SkillState;
  contribution: number;
  mustHave: boolean;
};

export type MatchResult = {
  score: number;
  breakdown: MatchBreakdownItem[];
};

const WEIGHT_MUST_HAVE = 1.0;
const WEIGHT_NICE_TO_HAVE = 0.4;

function effectiveWeight(req: SkillRequirement): number {
  if (typeof req.weight === "number" && req.weight > 0) return req.weight;
  return req.mustHave ? WEIGHT_MUST_HAVE : WEIGHT_NICE_TO_HAVE;
}

export function calcMatch(candidate: Candidate, job: Job): MatchResult {
  const candidateSkillIds = new Set(candidate.skills.map((s) => s.skillId));
  let totalWeight = 0;
  let scoreSum = 0;
  const breakdown: MatchBreakdownItem[] = [];

  for (const req of job.requirements) {
    const weight = effectiveWeight(req);
    const has = candidateSkillIds.has(req.skillId);
    const state: SkillState = has ? "match" : "missing";
    const pct = has ? 1 : 0;
    scoreSum += weight * pct * 100;
    totalWeight += weight;
    breakdown.push({
      skillId: req.skillId,
      name: req.name ?? skillById[req.skillId]?.name ?? req.skillId,
      state,
      contribution: Math.round(weight * pct * 100),
      mustHave: req.mustHave,
    });
  }

  const baseScore = Math.round(scoreSum / (totalWeight || 1));
  const adjustedScore = applyModifiers(baseScore, candidate, job);

  return {
    score: adjustedScore,
    breakdown: breakdown.sort((a, b) => {
      if (a.state !== b.state) return a.state === "match" ? -1 : 1;
      if (a.mustHave !== b.mustHave) return a.mustHave ? -1 : 1;
      return b.contribution - a.contribution;
    }),
  };
}

function applyModifiers(score: number, candidate: Candidate, job: Job): number {
  let adjusted = score;

  if (candidate.experienceYears >= 1) {
    adjusted = Math.min(100, adjusted + 3);
  }

  const wantedTypes = candidate.preferredJobTypes ?? [];
  if (wantedTypes.length > 0 && wantedTypes.includes(job.type)) {
    adjusted = Math.min(100, adjusted + 3);
  }

  const wantedModes = candidate.preferredWorkModes ?? [];
  const jobMode = job.workMode ?? "onsite";
  if (
    wantedModes.length > 0 &&
    (wantedModes.includes(jobMode) ||
      wantedModes.includes("hybrid") ||
      jobMode === "hybrid")
  ) {
    adjusted = Math.min(100, adjusted + 3);
  }

  const wantedCities = candidate.preferredCities ?? [];
  if (wantedCities.length > 0 && job.location) {
    const jobCity = job.location.split(",")[0].trim().toLowerCase();
    const cityMatch = wantedCities.some(
      (c) => c.toLowerCase() === jobCity,
    );
    if (cityMatch) {
      adjusted = Math.min(100, adjusted + 3);
    }
  }

  if (
    candidate.industries &&
    candidate.industries.length > 0 &&
    job.industryId
  ) {
    if (candidate.industries.includes(job.industryId)) {
      adjusted = Math.min(100, adjusted + 3);
    }
  }

  return adjusted;
}

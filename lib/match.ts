import type { Candidate, Job } from "./types";
import { skillById } from "./skills";

type SkillState = "match" | "missing";

export type MatchBreakdownItem = {
  skillId: string;
  name: string;
  state: SkillState;
  contribution: number;
};

export type MatchResult = {
  score: number;
  breakdown: MatchBreakdownItem[];
};

export function calcMatch(candidate: Candidate, job: Job): MatchResult {
  const candidateSkillIds = new Set(candidate.skills.map((s) => s.skillId));
  let totalWeight = 0;
  let scoreSum = 0;
  const breakdown: MatchBreakdownItem[] = [];

  for (const req of job.requirements) {
    const weight = req.weight ?? 1 / job.requirements.length;
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
    });
  }

  const baseScore = Math.round(scoreSum / (totalWeight || 1));
  const adjustedScore = applyModifiers(baseScore, candidate, job);

  return {
    score: adjustedScore,
    breakdown: breakdown.sort((a, b) => b.contribution - a.contribution),
  };
}

function applyModifiers(score: number, candidate: Candidate, job: Job): number {
  let adjusted = score;
  if (candidate.experienceYears >= 1) adjusted = Math.min(100, adjusted + 3);
  if (candidate.expectedSalary > 0 && candidate.expectedSalary > job.salaryMax) {
    adjusted = Math.max(0, adjusted - 5);
  }

  const wantedTypes = candidate.preferredJobTypes ?? [];
  if (wantedTypes.length > 0 && !wantedTypes.includes(job.type)) {
    adjusted = Math.max(0, adjusted - 12);
  }

  const wantedModes = candidate.preferredWorkModes ?? [];
  const jobMode = job.workMode ?? "onsite";
  if (
    wantedModes.length > 0 &&
    !wantedModes.includes("hybrid") &&
    !wantedModes.includes(jobMode) &&
    jobMode !== "hybrid"
  ) {
    adjusted = Math.max(0, adjusted - 8);
  }

  const wantedCities = candidate.preferredCities ?? [];
  if (wantedCities.length > 0 && job.location) {
    const jobCity = job.location.split(",")[0].trim().toLowerCase();
    const cityMatch = wantedCities.some(
      (c) => c.toLowerCase() === jobCity,
    );
    if (!cityMatch) {
      adjusted = Math.max(0, adjusted - 6);
    }
  }

  if (candidate.industries && candidate.industries.length > 0 && job.industry) {
    const wants = candidate.industries.map((s) => s.toLowerCase());
    if (wants.some((w) => job.industry.toLowerCase().includes(w))) {
      adjusted = Math.min(100, adjusted + 4);
    }
  }

  return adjusted;
}

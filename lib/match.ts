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

  const rawItems = job.requirements.map((req) => {
    const weight = effectiveWeight(req);
    const has = candidateSkillIds.has(req.skillId);
    const state: SkillState = has ? "match" : "missing";
    const raw = weight * (has ? 1 : 0) * 100;
    return { req, weight, state, raw };
  });

  const totalWeight = rawItems.reduce((sum, it) => sum + it.weight, 0);
  const rawSum = rawItems.reduce((sum, it) => sum + it.raw, 0);
  const baseScore = Math.round(rawSum / (totalWeight || 1));

  const floors = rawItems.map((it) => Math.floor(it.raw));
  const sumFloors = floors.reduce((a, b) => a + b, 0);
  const bumpsNeeded = Math.max(0, baseScore - sumFloors);
  const remainders = rawItems
    .map((it, i) => ({ i, frac: it.raw - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const bumpSet = new Set(
    remainders.slice(0, bumpsNeeded).map((r) => r.i),
  );
  const contributions = floors.map((f, i) => f + (bumpSet.has(i) ? 1 : 0));

  const breakdown: MatchBreakdownItem[] = rawItems.map((it, i) => ({
    skillId: it.req.skillId,
    name:
      it.req.name ?? skillById[it.req.skillId]?.name ?? it.req.skillId,
    state: it.state,
    contribution: contributions[i],
    mustHave: it.req.mustHave,
  }));

  const adjustedScore = applyModifiers(baseScore, candidate);

  return {
    score: adjustedScore,
    breakdown: breakdown.sort((a, b) => {
      if (a.state !== b.state) return a.state === "match" ? -1 : 1;
      if (a.mustHave !== b.mustHave) return a.mustHave ? -1 : 1;
      return b.contribution - a.contribution;
    }),
  };
}

function applyModifiers(score: number, _candidate: Candidate): number {
  return score;
}

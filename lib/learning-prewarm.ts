import { after } from "next/server";
import { getGeneratedPracticeTask } from "./practice-generation";
import { rankCandidateJobs } from "./recommendations";
import { skillById } from "./skills";
import type { Candidate } from "./types";

const PREWARM_SKILL_LIMIT = 2;

function uniqueSkillIds(skillIds: string[]): string[] {
  return Array.from(new Set(skillIds.filter((skillId) => skillById[skillId])));
}

async function priorityGapSkillIds(profile: Candidate): Promise<string[]> {
  const { ranked } = await rankCandidateJobs(profile, { top: 20 });
  const top = ranked[0];
  if (!top) return [];
  return uniqueSkillIds(
    top.breakdown
      .filter((item) => item.state !== "match")
      .map((item) => item.skillId),
  );
}

export async function prewarmLearningArtifactsForProfile(
  profile: Candidate,
): Promise<void> {
  const gapSkillIds = await priorityGapSkillIds(profile);
  const practiceSkillIds = gapSkillIds.slice(0, PREWARM_SKILL_LIMIT);

  for (const skillId of practiceSkillIds) {
    try {
      await getGeneratedPracticeTask(skillId);
    } catch (err) {
      console.warn("[learning-prewarm] practice prewarm failed:", err);
    }
  }
}

export function scheduleLearningPrewarmForProfile(profile: Candidate): void {
  after(async () => {
    try {
      await prewarmLearningArtifactsForProfile(profile);
    } catch (err) {
      console.warn("[learning-prewarm] background prewarm failed:", err);
    }
  });
}

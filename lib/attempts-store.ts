"use server";

import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";
import { skillById } from "./skills";
import { mergeSkillsAsync } from "./profile-store";

export type AssessmentAttempt = {
  id: string;
  userId: string;
  assessmentId: string;
  assessmentSlug: string; 
  skillId: string;
  score: number;
  level: 1 | 2 | 3;
  total: number;
  correct: number;
  takenAt: string;
};

function levelFromScore(score: number): 1 | 2 | 3 {
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export type RecordAttemptInput = {
  userId: string;
  assessmentId: string;
  assessmentSlug: string;
  skillId: string;
  total: number;
  correct: number;
};

export async function recordAttempt(
  input: RecordAttemptInput,
): Promise<AssessmentAttempt> {
  if (!isCosmosConfigured()) {
    throw new Error("Cosmos DB not configured");
  }
  const score = Math.round((input.correct / Math.max(1, input.total)) * 100);
  const level = levelFromScore(score);
  const attempt: AssessmentAttempt = {
    id: uid("at"),
    userId: input.userId,
    assessmentId: input.assessmentId,
    assessmentSlug: input.assessmentSlug,
    skillId: input.skillId,
    score,
    level,
    total: input.total,
    correct: input.correct,
    takenAt: new Date().toISOString(),
  };

  const container = getContainer(CONTAINERS.practiceAttempts);
  await container.items.create(attempt);

  if (skillById[input.skillId]) {
    await mergeSkillsAsync([{ skillId: input.skillId, level }], input.userId);
  }

  return attempt;
}

export async function listAttemptsForUser(
  userId: string,
): Promise<AssessmentAttempt[]> {
  if (!isCosmosConfigured()) return [];
  const container = getContainer(CONTAINERS.practiceAttempts);
  const { resources } = await container.items
    .query<AssessmentAttempt>({
      query:
        "SELECT * FROM c WHERE c.userId = @uid ORDER BY c.takenAt DESC",
      parameters: [{ name: "@uid", value: userId }],
    })
    .fetchAll();
  return resources;
}

export async function completedAssessmentIdsForUser(
  userId: string,
): Promise<Set<string>> {
  const attempts = await listAttemptsForUser(userId);
  return new Set(attempts.map((a) => a.assessmentId));
}

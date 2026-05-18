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
  passed: boolean;
  total: number;
  correct: number;
  takenAt: string;
};

const PASS_THRESHOLD = 50;

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
  const passed = score >= PASS_THRESHOLD;
  const attempt: AssessmentAttempt = {
    id: uid("at"),
    userId: input.userId,
    assessmentId: input.assessmentId,
    assessmentSlug: input.assessmentSlug,
    skillId: input.skillId,
    score,
    passed,
    total: input.total,
    correct: input.correct,
    takenAt: new Date().toISOString(),
  };

  const container = getContainer(CONTAINERS.practiceAttempts);
  await container.items.create(attempt);

  if (passed && skillById[input.skillId]) {
    await mergeSkillsAsync([{ skillId: input.skillId }], input.userId);
  }

  return attempt;
}

async function listAttemptsForUser(
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

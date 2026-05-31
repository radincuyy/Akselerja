"use server";

import { CONTAINERS, getContainer, isCosmosConfigured } from "../infra/db";
import { skillById } from "./skills";
import { mergeSkillsAsync } from "../profile/profile-store";
import { revalidateTag, unstable_cache } from "next/cache";

export type PracticeCriterionResult = {
  id: string;
  name: string;
  score: number;
  feedback: string;
};

export type PracticeAttempt = {
  id: string;
  userId: string;
  attemptType: "practice";
  taskId: string;
  taskSlug: string;
  taskTitle: string;
  skillId: string;
  score: number;
  passed: boolean;
  answer: string;
  completedAt: string;
  feedback?: string;
  gradedBy?: "ai" | "keyword";
  perCriterion?: PracticeCriterionResult[];
  mcCorrect?: number;
  mcTotal?: number;
};

const PRACTICE_PASS_THRESHOLD = 80;

function attemptsCacheTag(userId: string): string {
  return `attempts:${userId}`;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export type RecordPracticeAttemptInput = {
  userId: string;
  taskId: string;
  taskSlug: string;
  taskTitle: string;
  skillId: string;
  skillName?: string;
  score: number;
  answer: string;
  feedback?: string;
  gradedBy?: "ai" | "keyword";
  perCriterion?: PracticeCriterionResult[];
  mcCorrect?: number;
  mcTotal?: number;
};

export async function recordPracticeAttempt(
  input: RecordPracticeAttemptInput,
): Promise<PracticeAttempt> {
  if (!isCosmosConfigured()) {
    throw new Error("Cosmos DB not configured");
  }

  const passed = input.score >= PRACTICE_PASS_THRESHOLD;
  const attempt: PracticeAttempt = {
    id: uid("pt"),
    userId: input.userId,
    attemptType: "practice",
    taskId: input.taskId,
    taskSlug: input.taskSlug,
    taskTitle: input.taskTitle,
    skillId: input.skillId,
    score: input.score,
    passed,
    answer: input.answer,
    completedAt: new Date().toISOString(),
    feedback: input.feedback,
    gradedBy: input.gradedBy,
    perCriterion: input.perCriterion,
    mcCorrect: input.mcCorrect,
    mcTotal: input.mcTotal,
  };

  const container = getContainer(CONTAINERS.practiceAttempts);
  await container.items.create(attempt);

  if (passed) {
    const name = skillById[input.skillId]?.name ?? input.skillName;
    await mergeSkillsAsync(
      [name ? { skillId: input.skillId, name } : { skillId: input.skillId }],
      input.userId,
    );
  }
  revalidateTag(attemptsCacheTag(input.userId));

  return attempt;
}

export async function listPracticeAttemptsForUser(
  userId: string,
): Promise<PracticeAttempt[]> {
  const fetcher = unstable_cache(
    async (id: string): Promise<PracticeAttempt[]> => {
      if (!isCosmosConfigured()) return [];
      const container = getContainer(CONTAINERS.practiceAttempts);
      const { resources } = await container.items
        .query<PracticeAttempt>({
          query:
            "SELECT * FROM c WHERE c.userId = @uid AND c.attemptType = 'practice' AND IS_DEFINED(c.taskId) ORDER BY c.completedAt DESC",
          parameters: [{ name: "@uid", value: id }],
        })
        .fetchAll();
      return resources;
    },
    ["practice-attempts-for-user", userId],
    {
      tags: [attemptsCacheTag(userId)],
      revalidate: 60,
    },
  );
  return fetcher(userId);
}

export async function getLatestPracticeAttemptForUser(
  userId: string,
  taskId: string,
): Promise<PracticeAttempt | null> {
  const attempts = await listPracticeAttemptsForUser(userId);
  return attempts.find((attempt) => attempt.taskId === taskId) ?? null;
}

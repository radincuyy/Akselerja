"use server";

import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";
import { skillById } from "./skills";
import { mergeSkillsAsync } from "./profile-store";
import { revalidateTag, unstable_cache } from "next/cache";

export type AssessmentAttempt = {
  id: string;
  userId: string;
  attemptType?: "assessment";
  assessmentId: string;
  assessmentSlug: string;
  skillId: string;
  score: number;
  passed: boolean;
  total: number;
  correct: number;
  takenAt: string;
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
};

const PASS_THRESHOLD = 50;
const PRACTICE_PASS_THRESHOLD = 72;

function attemptsCacheTag(userId: string): string {
  return `attempts:${userId}`;
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
  const passed = score >= PASS_THRESHOLD;
  const attempt: AssessmentAttempt = {
    id: uid("at"),
    userId: input.userId,
    attemptType: "assessment",
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
  revalidateTag(attemptsCacheTag(input.userId));

  return attempt;
}

export type RecordPracticeAttemptInput = {
  userId: string;
  taskId: string;
  taskSlug: string;
  taskTitle: string;
  skillId: string;
  score: number;
  answer: string;
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
  };

  const container = getContainer(CONTAINERS.practiceAttempts);
  await container.items.create(attempt);

  if (passed && skillById[input.skillId]) {
    await mergeSkillsAsync([{ skillId: input.skillId }], input.userId);
  }
  revalidateTag(attemptsCacheTag(input.userId));

  return attempt;
}

async function listAttemptsForUser(
  userId: string,
): Promise<AssessmentAttempt[]> {
  const fetcher = unstable_cache(
    async (id: string): Promise<AssessmentAttempt[]> => {
      if (!isCosmosConfigured()) return [];
      const container = getContainer(CONTAINERS.practiceAttempts);
      const { resources } = await container.items
        .query<AssessmentAttempt>({
          query:
            "SELECT * FROM c WHERE c.userId = @uid AND IS_DEFINED(c.assessmentId) ORDER BY c.takenAt DESC",
          parameters: [{ name: "@uid", value: id }],
        })
        .fetchAll();
      return resources;
    },
    ["attempts-for-user", userId],
    {
      tags: [attemptsCacheTag(userId)],
      revalidate: 60,
    },
  );
  return fetcher(userId);
}

export async function completedAssessmentIdsForUser(
  userId: string,
): Promise<Set<string>> {
  const attempts = await listAttemptsForUser(userId);
  return new Set(attempts.map((a) => a.assessmentId));
}

export async function listRecentAssessmentAttemptsForUser(
  userId: string,
  limit = 3,
): Promise<AssessmentAttempt[]> {
  const attempts = await listAttemptsForUser(userId);
  return attempts.slice(0, limit);
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
            "SELECT * FROM c WHERE c.userId = @uid AND IS_DEFINED(c.taskId) ORDER BY c.completedAt DESC",
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

export async function completedPracticeTaskIdsForUser(
  userId: string,
): Promise<Set<string>> {
  const attempts = await listPracticeAttemptsForUser(userId);
  return new Set(attempts.map((a) => a.taskId));
}

export async function getLatestPracticeAttemptForUser(
  userId: string,
  taskId: string,
): Promise<PracticeAttempt | null> {
  const attempts = await listPracticeAttemptsForUser(userId);
  return attempts.find((attempt) => attempt.taskId === taskId) ?? null;
}

export async function listRecentPracticeAttemptsForUser(
  userId: string,
  limit = 3,
): Promise<PracticeAttempt[]> {
  const attempts = await listPracticeAttemptsForUser(userId);
  return attempts.slice(0, limit);
}

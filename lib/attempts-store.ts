"use server";

import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";
import { skillById } from "./skills";
import { mergeSkillsAsync } from "./profile-store";
import { revalidateTag, unstable_cache } from "next/cache";

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

export type CheckpointAttempt = {
  id: string;
  userId: string;
  attemptType: "checkpoint";
  skillId: string;
  skillName: string;
  total: number;
  correct: number;
  passed: boolean;
  answers: { questionId: string; selectedIndex: number; correct: boolean }[];
  completedAt: string;
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

export type RecordCheckpointAttemptInput = {
  userId: string;
  skillId: string;
  skillName: string;
  total: number;
  correct: number;
  passed: boolean;
  answers: { questionId: string; selectedIndex: number; correct: boolean }[];
};

export async function recordCheckpointAttempt(
  input: RecordCheckpointAttemptInput,
): Promise<CheckpointAttempt> {
  if (!isCosmosConfigured()) {
    throw new Error("Cosmos DB not configured");
  }

  const attempt: CheckpointAttempt = {
    id: uid("cp"),
    userId: input.userId,
    attemptType: "checkpoint",
    skillId: input.skillId,
    skillName: input.skillName,
    total: input.total,
    correct: input.correct,
    passed: input.passed,
    answers: input.answers,
    completedAt: new Date().toISOString(),
  };

  const container = getContainer(CONTAINERS.practiceAttempts);
  await container.items.create(attempt);

  if (input.passed) {
    await mergeSkillsAsync(
      [{ skillId: input.skillId, name: input.skillName }],
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

export async function listCheckpointAttemptsForUser(
  userId: string,
): Promise<CheckpointAttempt[]> {
  const fetcher = unstable_cache(
    async (id: string): Promise<CheckpointAttempt[]> => {
      if (!isCosmosConfigured()) return [];
      const container = getContainer(CONTAINERS.practiceAttempts);
      const { resources } = await container.items
        .query<CheckpointAttempt>({
          query:
            "SELECT * FROM c WHERE c.userId = @uid AND c.attemptType = 'checkpoint' ORDER BY c.completedAt DESC",
          parameters: [{ name: "@uid", value: id }],
        })
        .fetchAll();
      return resources;
    },
    ["checkpoint-attempts-for-user", userId],
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

export async function getLatestCheckpointAttemptForUser(
  userId: string,
  skillId: string,
): Promise<CheckpointAttempt | null> {
  const attempts = await listCheckpointAttemptsForUser(userId);
  return attempts.find((attempt) => attempt.skillId === skillId) ?? null;
}

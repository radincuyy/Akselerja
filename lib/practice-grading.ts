import type { PracticeRubricCriterion, PracticeTask } from "./types";

export type CriterionResult = {
  criterion: PracticeRubricCriterion;
  score: number;
  hits: number;
};

export function scoreCriterion(
  answer: string,
  criterion: PracticeRubricCriterion,
) {
  const normalized = answer.toLowerCase();
  const hits = criterion.signals.filter((signal) =>
    normalized.includes(signal.toLowerCase()),
  ).length;
  const trimmedLength = answer.trim().length;
  const lengthBonus = Math.min(12, Math.floor(trimmedLength / 180) * 4);
  // A near-empty answer should be able to score genuinely low, not floor at 30.
  if (trimmedLength < 40) {
    return { score: Math.min(20, 8 + hits * 4), hits };
  }
  const base = hits === 0 ? 38 : 58 + hits * 9;
  const score = Math.max(30, Math.min(96, base + lengthBonus));
  return { score, hits };
}

export function gradePracticeAnswer(
  task: PracticeTask,
  answer: string,
): CriterionResult[] {
  return task.rubric.map((criterion) => {
    const { score, hits } = scoreCriterion(answer, criterion);
    return { criterion, score, hits };
  });
}

export function calculatePracticeScore(results: CriterionResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(
    results.reduce(
      (sum, result) => sum + result.score * (result.criterion.weight / 100),
      0,
    ),
  );
}

export function levelFromPracticeScore(score: number) {
  if (score >= 80) return "Siap divalidasi";
  if (score >= 65) return "Hampir siap";
  if (score >= 50) return "Perlu latihan ulang";
  return "Butuh fondasi";
}

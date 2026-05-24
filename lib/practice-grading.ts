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
  const lengthBonus = Math.min(12, Math.floor(answer.trim().length / 180) * 4);
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
  if (score >= 85) return "Siap divalidasi";
  if (score >= 72) return "Hampir siap";
  if (score >= 58) return "Perlu latihan ulang";
  return "Butuh fondasi";
}

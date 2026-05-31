import { describe, expect, it } from "vitest";
import {
  calculatePracticeScore,
  gradePracticeAnswer,
  levelFromPracticeScore,
  scoreCriterion,
} from "@/lib/learning/practice-grading";
import type { PracticeRubricCriterion, PracticeTask } from "@/lib/shared/types";

const criterion: PracticeRubricCriterion = {
  id: "c1",
  name: "Kasus & angka",
  description: "Sebut data konkret",
  weight: 50,
  signals: ["data", "angka", "persentase"],
};

const task: PracticeTask = {
  id: "p1",
  slug: "test",
  role: "Admin",
  title: "Latihan",
  skillId: "excel",
  type: "case-simulation",
  estimatedMinutes: 20,
  sourceLabel: "test",
  sourceNotes: [],
  scenario: "",
  instructions: [],
  expectedEvidence: [],
  rubric: [
    criterion,
    {
      id: "c2",
      name: "Komunikasi",
      description: "Jelas dan ringkas",
      weight: 50,
      signals: ["jelas", "singkat"],
    },
  ],
};

describe("scoreCriterion", () => {
  it("returns base score with zero hits on a full-length answer", () => {
    const { score, hits } = scoreCriterion(
      "saya menulis jawaban yang cukup panjang tetapi tidak menyebut hal yang dicari",
      criterion,
    );
    expect(hits).toBe(0);
    expect(score).toBeGreaterThanOrEqual(30);
    expect(score).toBeLessThan(70);
  });

  it("scores a near-empty answer low", () => {
    const { score } = scoreCriterion("ok", criterion);
    expect(score).toBeLessThan(30);
  });

  it("rewards multiple signal matches", () => {
    const { score, hits } = scoreCriterion(
      "saya pakai data dan angka untuk persentase",
      criterion,
    );
    expect(hits).toBe(3);
    expect(score).toBeGreaterThan(70);
  });

  it("caps score at 96", () => {
    const longAnswer = "data angka persentase ".repeat(100);
    const { score } = scoreCriterion(longAnswer, criterion);
    expect(score).toBeLessThanOrEqual(96);
  });

  it("matches signals case-insensitive", () => {
    const lower = scoreCriterion("data angka persentase", criterion);
    const upper = scoreCriterion("DATA ANGKA PERSENTASE", criterion);
    expect(lower.hits).toBe(upper.hits);
  });
});

describe("gradePracticeAnswer", () => {
  it("returns one result per criterion", () => {
    const results = gradePracticeAnswer(task, "data");
    expect(results).toHaveLength(2);
    expect(results[0].criterion.id).toBe("c1");
    expect(results[1].criterion.id).toBe("c2");
  });
});

describe("calculatePracticeScore", () => {
  it("returns 0 for empty results", () => {
    expect(calculatePracticeScore([])).toBe(0);
  });

  it("weighted average from rubric", () => {
    const results = gradePracticeAnswer(
      task,
      "data angka persentase jelas singkat",
    );
    const score = calculatePracticeScore(results);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("levelFromPracticeScore", () => {
  it("classifies score bands", () => {
    expect(levelFromPracticeScore(90)).toBe("Siap divalidasi");
    expect(levelFromPracticeScore(75)).toBe("Hampir siap");
    expect(levelFromPracticeScore(60)).toBe("Perlu latihan ulang");
    expect(levelFromPracticeScore(40)).toBe("Butuh fondasi");
  });
});

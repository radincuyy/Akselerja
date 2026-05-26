import { describe, expect, it } from "vitest";
import { calcMatch } from "@/lib/match";
import type { Candidate, Job } from "@/lib/types";

function buildCandidate(skillIds: string[]): Candidate {
  return {
    id: "c-test",
    name: "Test User",
    email: "test@example.com",
    location: "Jakarta",
    experienceYears: 0,
    expectedSalary: 0,
    readinessScore: 0,
    bio: "",
    skills: skillIds.map((id) => ({ skillId: id })),
  };
}

function buildJob(
  reqs: { skillId: string; mustHave: boolean; weight?: number }[],
): Job {
  return {
    id: "j-test",
    title: "Test Job",
    company: "Test Co",
    location: "Jakarta",
    salaryMin: 0,
    salaryMax: 0,
    type: "Full-time",
    industry: "Tech",
    description: "",
    requirements: reqs.map((r) => ({
      skillId: r.skillId,
      mustHave: r.mustHave,
      weight: r.weight,
    })),
    postedAt: "2026-01-01",
  };
}

describe("calcMatch", () => {
  it("returns 0 when candidate has no matching skills", () => {
    const candidate = buildCandidate([]);
    const job = buildJob([
      { skillId: "excel", mustHave: true },
      { skillId: "python", mustHave: false },
    ]);
    const { score, breakdown } = calcMatch(candidate, job);
    expect(score).toBe(0);
    expect(breakdown).toHaveLength(2);
    expect(breakdown.every((b) => b.state === "missing")).toBe(true);
  });

  it("returns 100 when candidate covers every requirement", () => {
    const candidate = buildCandidate(["excel", "python"]);
    const job = buildJob([
      { skillId: "excel", mustHave: true },
      { skillId: "python", mustHave: false },
    ]);
    const { score } = calcMatch(candidate, job);
    expect(score).toBe(100);
  });

  it("contributions sum to score (largest-remainder rounding)", () => {
    const candidate = buildCandidate(["a", "b"]);
    const job = buildJob([
      { skillId: "a", mustHave: true },
      { skillId: "b", mustHave: true },
      { skillId: "c", mustHave: true },
    ]);
    const { score, breakdown } = calcMatch(candidate, job);
    const total = breakdown.reduce((sum, b) => sum + b.contribution, 0);
    expect(total).toBe(score);
  });

  it("must-have requirements weigh more than nice-to-have", () => {
    const mustHave = buildJob([
      { skillId: "a", mustHave: true },
      { skillId: "b", mustHave: false },
    ]);
    const niceToHave = buildJob([
      { skillId: "a", mustHave: false },
      { skillId: "b", mustHave: true },
    ]);
    const candidate = buildCandidate(["a"]);
    const scoreA = calcMatch(candidate, mustHave).score;
    const scoreB = calcMatch(candidate, niceToHave).score;
    expect(scoreA).toBeGreaterThan(scoreB);
  });

  it("matched items sort before missing items in breakdown", () => {
    const candidate = buildCandidate(["b"]);
    const job = buildJob([
      { skillId: "a", mustHave: true },
      { skillId: "b", mustHave: true },
      { skillId: "c", mustHave: false },
    ]);
    const { breakdown } = calcMatch(candidate, job);
    const firstMissingIdx = breakdown.findIndex((b) => b.state === "missing");
    const lastMatchIdx = breakdown.findLastIndex((b) => b.state === "match");
    expect(lastMatchIdx).toBeLessThan(firstMissingIdx);
  });

  it("handles empty requirements list", () => {
    const candidate = buildCandidate(["a"]);
    const job = buildJob([]);
    const { score, breakdown } = calcMatch(candidate, job);
    expect(score).toBe(0);
    expect(breakdown).toHaveLength(0);
  });

  it("returns 4 dimensions with skill always applicable when reqs exist", () => {
    const candidate = buildCandidate(["a"]);
    const job = buildJob([{ skillId: "a", mustHave: true }]);
    const { dimensions } = calcMatch(candidate, job);
    expect(dimensions.map((d) => d.id)).toEqual([
      "skill",
      "semantic",
      "experience",
      "education",
    ]);
    expect(dimensions.find((d) => d.id === "skill")?.applicable).toBe(true);
  });

  it("redistributes weight when only skill dimension applies", () => {
    const candidate = buildCandidate(["a"]);
    const job = buildJob([{ skillId: "a", mustHave: true }]);
    const { dimensions } = calcMatch(candidate, job);
    const skill = dimensions.find((d) => d.id === "skill");
    expect(skill?.weight).toBe(100);
  });

  it("semantic dimension inactive when no profileVector", () => {
    const candidate = buildCandidate(["a"]);
    const job = buildJob([{ skillId: "a", mustHave: true }]);
    const { dimensions } = calcMatch(candidate, job);
    expect(
      dimensions.find((d) => d.id === "semantic")?.applicable,
    ).toBe(false);
  });

  it("dimension contributions sum approximately to score", () => {
    const candidate = buildCandidate(["a", "b"]);
    const job = buildJob([
      { skillId: "a", mustHave: true },
      { skillId: "b", mustHave: false },
    ]);
    const { score, dimensions } = calcMatch(candidate, job);
    const sum = dimensions.reduce((acc, d) => acc + d.contribution, 0);
    expect(Math.abs(sum - score)).toBeLessThanOrEqual(2);
  });
});

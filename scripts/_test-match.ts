import { calcMatch } from "../lib/match";
import { buildMatchReason } from "../lib/match-reason";
import { deriveIndustryId } from "../lib/industry-mapping";
import type { Candidate, Job } from "../lib/types";

let failures = 0;

function expect(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "me",
    name: "Tester",
    email: "tester@example.com",
    location: "Jakarta",
    experienceYears: 0,
    expectedSalary: 0,
    readinessScore: 0,
    bio: "",
    skills: [],
    ...overrides,
  };
}

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "j-1",
    title: "Junior Developer",
    company: "Acme",
    location: "Jakarta",
    salaryMin: 5000000,
    salaryMax: 8000000,
    type: "Full-time",
    industry: "Computer & Software",
    description: "Junior dev role",
    requirements: [],
    postedAt: "2026-01-01T00:00:00Z",
    status: "open",
    ...overrides,
  };
}

console.log("\n[match] full skill match -> 100");
{
  const cand = makeCandidate({
    skills: [
      { skillId: "javascript", name: "JavaScript" },
      { skillId: "react", name: "React" },
    ],
  });
  const job = makeJob({
    requirements: [
      { skillId: "javascript", mustHave: true, name: "JavaScript" },
      { skillId: "react", mustHave: true, name: "React" },
    ],
  });
  const r = calcMatch(cand, job);
  expect("score is 100", r.score === 100, `got ${r.score}`);
  expect(
    "all breakdown items match state",
    r.breakdown.every((b) => b.state === "match"),
  );
}

console.log("\n[match] zero overlap -> 0");
{
  const cand = makeCandidate({
    skills: [{ skillId: "cooking", name: "Cooking" }],
  });
  const job = makeJob({
    requirements: [
      { skillId: "javascript", mustHave: true, name: "JavaScript" },
    ],
  });
  const r = calcMatch(cand, job);
  expect("score is 0", r.score === 0);
  expect(
    "missing breakdown only",
    r.breakdown.every((b) => b.state === "missing"),
  );
}

console.log("\n[match] contributions sum equals score (largest remainder)");
{
  const reqs = Array.from({ length: 14 }, (_, i) => ({
    skillId: `s${i}`,
    mustHave: true,
    name: `Skill${i}`,
  }));
  const cand = makeCandidate({
    skills: reqs.slice(0, 6).map((r) => ({ skillId: r.skillId, name: r.name })),
  });
  const job = makeJob({ requirements: reqs });
  const r = calcMatch(cand, job);
  const sum = r.breakdown.reduce((acc, b) => acc + b.contribution, 0);
  expect(`score 43`, r.score === 43, `got ${r.score}`);
  expect(
    `contributions sum to score`,
    sum === r.score,
    `score=${r.score}, sum=${sum}`,
  );
}

console.log("\n[match-reason] fresh grad does not see harsh experience nudge");
{
  const cand = makeCandidate({
    experienceYears: 0,
    skills: [{ skillId: "excel", name: "Excel" }],
  });
  const job = makeJob({
    requirements: [{ skillId: "excel", mustHave: true, name: "Excel" }],
    minExperienceYears: 2,
  });
  const reason = buildMatchReason(cand, job, calcMatch(cand, job));
  expect(
    "negative does not include 'butuh pengalaman'",
    !reason.negative.includes("butuh pengalaman"),
    `got: ${reason.negative}`,
  );
}

console.log("\n[match-reason] mid-career sees experience nudge if short");
{
  const cand = makeCandidate({
    experienceYears: 1,
    skills: [{ skillId: "excel", name: "Excel" }],
  });
  const job = makeJob({
    requirements: [{ skillId: "excel", mustHave: true, name: "Excel" }],
    minExperienceYears: 3,
  });
  const reason = buildMatchReason(cand, job, calcMatch(cand, job));
  expect(
    "negative mentions experience gap for >0 years",
    reason.negative.includes("pengalaman"),
    `got: ${reason.negative}`,
  );
}

console.log("\n[industry-mapping] breadcrumb derives industry id");
{
  expect(
    "english breadcrumb returned as-is (identity)",
    deriveIndustryId(["Computer & Software", "IT Support"]) ===
      "Computer & Software",
  );
  expect("empty breadcrumb returns null", deriveIndustryId([]) === null);
  expect(
    "undefined breadcrumb returns null",
    deriveIndustryId(undefined) === null,
  );
}

console.log("\n");
if (failures > 0) {
  console.error(`FAIL: ${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("OK: all assertions passed.");

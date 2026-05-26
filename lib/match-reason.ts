import type { Candidate, Job } from "./types";
import type { MatchResult } from "./match";

export type MatchReason = {
  positive: string;
  negative: string;
};

function joinList(parts: string[], max = 2): string {
  const trimmed = parts.slice(0, max);
  if (trimmed.length === 0) return "";
  if (trimmed.length === 1) return trimmed[0];
  return `${trimmed.slice(0, -1).join(", ")} dan ${trimmed[trimmed.length - 1]}`;
}

export function buildMatchReason(
  candidate: Candidate,
  job: Job,
  match: Pick<MatchResult, "score" | "breakdown">,
): MatchReason {
  const matched = match.breakdown.filter((b) => b.state === "match");
  const missing = match.breakdown.filter((b) => b.state === "missing");
  const mustHaveMissing = missing.filter((b) => b.mustHave);
  const totalSkills = match.breakdown.length;

  const positives: string[] = [];

  if (totalSkills > 0 && matched.length > 0) {
    const sample = matched.slice(0, 2).map((b) => b.name);
    const ratio = `${matched.length} dari ${totalSkills} skill`;
    if (sample.length === 1) {
      positives.push(`${ratio} terpenuhi (${sample[0]})`);
    } else {
      positives.push(`${ratio} terpenuhi (${sample.join(", ")})`);
    }
  }

  if (
    typeof job.minExperienceYears === "number" &&
    candidate.experienceYears >= job.minExperienceYears &&
    job.minExperienceYears > 0
  ) {
    positives.push(
      `pengalaman ${candidate.experienceYears} tahun memenuhi syarat`,
    );
  }

  if (
    candidate.expectedSalary > 0 &&
    job.salaryMin > 0 &&
    job.salaryMin >= candidate.expectedSalary
  ) {
    positives.push("gaji di atas ekspektasimu");
  }

  const negatives: string[] = [];

  if (mustHaveMissing.length > 0) {
    const sample = mustHaveMissing.slice(0, 2).map((b) => b.name);
    if (mustHaveMissing.length === 1) {
      negatives.push(`skill wajib ${sample[0]} belum ada`);
    } else {
      negatives.push(
        `${mustHaveMissing.length} skill wajib belum ada (${sample.join(", ")})`,
      );
    }
  } else if (missing.length > 0 && matched.length > 0) {
    if (missing.length >= 2) {
      const sample = missing.slice(0, 2).map((b) => b.name);
      negatives.push(
        `${missing.length} skill pendukung belum ada (${joinList(sample)})`,
      );
    }
  } else if (matched.length === 0 && missing.length > 0) {
    negatives.push("belum ada skill profilmu yang cocok");
  }

  if (
    typeof job.minExperienceYears === "number" &&
    job.minExperienceYears > 0 &&
    candidate.experienceYears > 0 &&
    candidate.experienceYears < job.minExperienceYears
  ) {
    negatives.push(
      `butuh pengalaman ${job.minExperienceYears} tahun, kamu baru ${candidate.experienceYears}`,
    );
  }

  if (
    candidate.expectedSalary > 0 &&
    job.salaryMax > 0 &&
    job.salaryMax < candidate.expectedSalary
  ) {
    negatives.push("gaji maksimum di bawah ekspektasimu");
  }

  return {
    positive: composeSentence(positives, "Cocok karena"),
    negative: composeSentence(negatives, "Yang menahan:"),
  };
}

function composeSentence(parts: string[], prefix: string): string {
  const items = Array.from(new Set(parts)).slice(0, 3);
  if (items.length === 0) return "";
  const joined = joinList(items, items.length);
  return `${prefix} ${joined}.`;
}

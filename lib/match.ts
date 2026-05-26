import type { Candidate, Job, SkillRequirement } from "./types";
import { skillById } from "./skills";

type SkillState = "match" | "missing";

type MatchBreakdownItem = {
  skillId: string;
  name: string;
  state: SkillState;
  contribution: number;
  mustHave: boolean;
};

export type MatchDimensionId =
  | "skill"
  | "semantic"
  | "experience"
  | "education";

export type MatchDimension = {
  id: MatchDimensionId;
  label: string;
  ratio: number;
  weight: number;
  contribution: number;
  detail: string;
  applicable: boolean;
};

export type MatchResult = {
  score: number;
  breakdown: MatchBreakdownItem[];
  dimensions: MatchDimension[];
};

const WEIGHT_MUST_HAVE = 1.0;
const WEIGHT_NICE_TO_HAVE = 0.4;

const BASE_WEIGHTS: Record<MatchDimensionId, number> = {
  skill: 45,
  semantic: 30,
  experience: 15,
  education: 10,
};

const EDUCATION_RANK: Record<string, number> = {
  "less than high school": 0,
  primary_school: 1,
  PRIMARY_SCHOOL: 1,
  secondary_school: 2,
  SECONDARY_SCHOOL: 2,
  "high school": 3,
  HIGH_SCHOOL: 3,
  "associate degree": 4,
  "professional certificate": 4,
  DIPLOMA: 4,
  PROFESSIONAL_EDUCATION: 4,
  "bachelor degree": 5,
  BACHELOR_DEGREE: 5,
  "master degree": 6,
  MASTER_DEGREE: 6,
  doctorate: 7,
  DOCTORATE: 7,
};

function effectiveWeight(req: SkillRequirement): number {
  if (typeof req.weight === "number" && req.weight > 0) return req.weight;
  return req.mustHave ? WEIGHT_MUST_HAVE : WEIGHT_NICE_TO_HAVE;
}

function skillRatio(
  candidate: Candidate,
  job: Job,
): { ratio: number; breakdown: MatchBreakdownItem[] } {
  const candidateSkillIds = new Set(candidate.skills.map((s) => s.skillId));

  const rawItems = job.requirements.map((req) => {
    const weight = effectiveWeight(req);
    const has = candidateSkillIds.has(req.skillId);
    const state: SkillState = has ? "match" : "missing";
    return { req, weight, state, has };
  });

  const totalWeight = rawItems.reduce((sum, it) => sum + it.weight, 0);
  const rawContribs = rawItems.map((it) =>
    it.has ? (it.weight / (totalWeight || 1)) * 100 : 0,
  );
  const ratio = rawItems.length === 0
    ? 0
    : Math.min(1, rawContribs.reduce((sum, v) => sum + v, 0) / 100);

  const baseScore = Math.round(rawContribs.reduce((sum, v) => sum + v, 0));
  const floors = rawContribs.map((v) => Math.floor(v));
  const sumFloors = floors.reduce((a, b) => a + b, 0);
  const bumpsNeeded = Math.max(0, baseScore - sumFloors);
  const remainders = rawContribs
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const bumpSet = new Set(remainders.slice(0, bumpsNeeded).map((r) => r.i));
  const contributions = floors.map((f, i) => f + (bumpSet.has(i) ? 1 : 0));

  const breakdown: MatchBreakdownItem[] = rawItems.map((it, i) => ({
    skillId: it.req.skillId,
    name: it.req.name ?? skillById[it.req.skillId]?.name ?? it.req.skillId,
    state: it.state,
    contribution: contributions[i],
    mustHave: it.req.mustHave,
  }));
  breakdown.sort((a, b) => {
    if (a.state !== b.state) return a.state === "match" ? -1 : 1;
    if (a.mustHave !== b.mustHave) return a.mustHave ? -1 : 1;
    return b.contribution - a.contribution;
  });

  return { ratio, breakdown };
}

function semanticRatio(
  candidate: Candidate,
  job: Job,
): { ratio: number; applicable: boolean } {
  const a = candidate.profileVector;
  const b = job.descriptionVector;
  if (!a || !b || a.length !== b.length) {
    return { ratio: 0, applicable: false };
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return { ratio: 0, applicable: false };
  const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  const ratio = Math.max(0, Math.min(1, (cosine + 1) / 2));
  return { ratio, applicable: true };
}

function experienceRatio(
  candidate: Candidate,
  job: Job,
): { ratio: number; applicable: boolean; detail: string } {
  const min = job.minExperienceYears;
  const max = job.maxExperienceYears;
  if (min == null && max == null) {
    return { ratio: 1, applicable: false, detail: "Tidak disebut" };
  }
  const years = candidate.experienceYears ?? 0;
  if (min != null && years < min) {
    const gap = min - years;
    const ratio = Math.max(0, 1 - gap / Math.max(min, 1));
    return { ratio, applicable: true, detail: `Kamu ${years} thn, posisi minta ${min}+ thn` };
  }
  if (max != null && years > max + 2) {
    const over = years - max;
    const ratio = Math.max(0.5, 1 - over / 10);
    return { ratio, applicable: true, detail: `Kamu ${years} thn, posisi targetkan ${max} thn` };
  }
  return { ratio: 1, applicable: true, detail: `Kamu ${years} thn, sesuai` };
}

function highestCandidateEducation(candidate: Candidate): number {
  if (!candidate.education || candidate.education.length === 0) return -1;
  let best = -1;
  for (const e of candidate.education) {
    const raw = (e.degree ?? "").trim();
    if (!raw) continue;
    if (raw in EDUCATION_RANK) {
      best = Math.max(best, EDUCATION_RANK[raw]);
      continue;
    }
    const key = raw.toLowerCase();
    if (key in EDUCATION_RANK) {
      best = Math.max(best, EDUCATION_RANK[key]);
      continue;
    }
    if (/\b(doktor|doctorate|phd|ph\.?d|s[\s.\-]?3)\b/i.test(raw)) {
      best = Math.max(best, 7);
    } else if (
      /\b(magister|master|s[\s.\-]?2|m\.?(kom|m|ba|t|si|pd|hum|sn))\b/i.test(raw)
    ) {
      best = Math.max(best, 6);
    } else if (
      /\b(sarjana|bachelor|s[\s.\-]?1)\b/i.test(raw) ||
      /\bs\.(kom|e|t|pd|h|sos|si|psi|ked|sn|kep|gz|fil|p|tr|ag|ip|st)\b/i.test(
        raw,
      )
    ) {
      best = Math.max(best, 5);
    } else if (/\b(diploma|d[\s.\-]?[1-4]|amd|ahli\s+madya)\b/i.test(raw)) {
      best = Math.max(best, 4);
    } else if (
      /\b(sma|smk|aliyah|paket\s+c|sekolah\s+menengah\s+atas)\b/i.test(raw)
    ) {
      best = Math.max(best, 3);
    } else if (
      /\b(smp|mts|paket\s+b|sekolah\s+menengah\s+pertama)\b/i.test(raw)
    ) {
      best = Math.max(best, 2);
    } else if (/\b(sd|paket\s+a|sekolah\s+dasar)\b/i.test(raw)) {
      best = Math.max(best, 1);
    }
  }
  return best;
}

function educationRatio(
  candidate: Candidate,
  job: Job,
): { ratio: number; applicable: boolean; detail: string } {
  const required = job.minEducation;
  if (!required) return { ratio: 1, applicable: false, detail: "Tidak disebut" };
  const reqRank = EDUCATION_RANK[required] ?? EDUCATION_RANK[required.toLowerCase()];
  if (reqRank == null) return { ratio: 1, applicable: false, detail: "Tidak disebut" };
  const candidateRank = highestCandidateEducation(candidate);
  if (candidateRank < 0) return { ratio: 0, applicable: true, detail: "Pendidikanmu belum diisi" };
  if (candidateRank >= reqRank) return { ratio: 1, applicable: true, detail: "Pendidikanmu memenuhi" };
  const gap = reqRank - candidateRank;
  return { ratio: Math.max(0, 1 - gap * 0.4), applicable: true, detail: "Posisi minta jenjang lebih tinggi" };
}

export function calcMatch(candidate: Candidate, job: Job): MatchResult {
  const skill = skillRatio(candidate, job);
  const semantic = semanticRatio(candidate, job);
  const experience = experienceRatio(candidate, job);
  const education = educationRatio(candidate, job);

  const dims: { id: MatchDimensionId; ratio: number; applicable: boolean; label: string; detail: string }[] = [
    { id: "skill", ratio: skill.ratio, applicable: job.requirements.length > 0, label: "Skill", detail: `${skill.breakdown.filter((b) => b.state === "match").length} dari ${skill.breakdown.length} skill cocok` },
    { id: "semantic", ratio: semantic.ratio, applicable: semantic.applicable, label: "Profil & deskripsi", detail: semantic.applicable ? "Berdasarkan isi CV vs deskripsi lowongan" : "Belum ada vektor profil" },
    { id: "experience", ratio: experience.ratio, applicable: experience.applicable, label: "Pengalaman", detail: experience.detail },
    { id: "education", ratio: education.ratio, applicable: education.applicable, label: "Pendidikan", detail: education.detail },
  ];

  const totalWeight = dims
    .filter((d) => d.applicable)
    .reduce((sum, d) => sum + BASE_WEIGHTS[d.id], 0);

  const dimensions: MatchDimension[] = dims.map((d) => {
    const baseWeight = BASE_WEIGHTS[d.id];
    const weight = d.applicable && totalWeight > 0
      ? (baseWeight / totalWeight) * 100
      : 0;
    const contribution = Math.round(d.ratio * weight);
    return {
      id: d.id,
      label: d.label,
      ratio: d.ratio,
      weight: Math.round(weight),
      contribution,
      detail: d.detail,
      applicable: d.applicable,
    };
  });

  const score = Math.max(
    0,
    Math.min(100, dimensions.reduce((sum, d) => sum + d.contribution, 0)),
  );

  return { score, breakdown: skill.breakdown, dimensions };
}

import type {
  Achievement,
  Candidate,
  CvFile,
  Education,
  Experience,
  OrganizationExperience,
  ProjectExperience,
} from "./types";
import { unstable_cache } from "next/cache";
import { CONTAINERS, getContainer } from "./db";

type CandidateSkill = Candidate["skills"][number];

export function profileCacheTag(userId: string): string {
  return `profile:${userId}`;
}

type Visibility = "applied-only" | "all-companies";

type CandidateRecord = Candidate & {
  userId: string;
  visibility?: Visibility;
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function stripCosmos(record: CandidateRecord): Candidate {
  const {
    userId: _u,
    visibility: _v,
    ...rest
  } = record as CandidateRecord & Record<string, unknown>;
  return rest as Candidate;
}

export async function getProfileAsync(userId: string): Promise<Candidate | null> {
  const fetcher = unstable_cache(
    async (id: string) => {
      const container = getContainer(CONTAINERS.candidates);
      try {
        const { resource } = await container
          .item(id, id)
          .read<CandidateRecord>();
        if (!resource) return null;
        return stripCosmos(resource);
      } catch (err: unknown) {
        if (is404(err)) return null;
        throw err;
      }
    },
    ["profile", userId],
    {
      tags: [profileCacheTag(userId)],
      revalidate: 300,
    },
  );
  return fetcher(userId);
}

export type ProfileBasicInput = {
  name: string;
  location: string;
  bio: string;
  experienceYears: number;
  expectedSalary: number;
  email: string;
};

function is404(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && (err as { code: number }).code === 404);
}

async function readRecord(
  userId: string,
): Promise<CandidateRecord | null> {
  const container = getContainer(CONTAINERS.candidates);
  try {
    const { resource } = await container
      .item(userId, userId)
      .read<CandidateRecord>();
    return resource ?? null;
  } catch (err: unknown) {
    if (is404(err)) return null;
    throw err;
  }
}

async function patchExistingSection<K extends keyof CandidateRecord>(
  userId: string,
  patch: Pick<CandidateRecord, K>,
): Promise<Candidate> {
  const existing = await readRecord(userId);
  if (!existing) {
    throw new Error(
      `Candidate profile not found for userId="${userId}". The onboarding flow should have created it.`,
    );
  }
  const next: CandidateRecord = { ...existing, ...patch };
  const container = getContainer(CONTAINERS.candidates);
  await container.items.upsert(next);
  return stripCosmos(next);
}

export async function updateProfileBasicAsync(
  input: ProfileBasicInput,
  userId: string,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const current = await readRecord(userId);
  const base: Candidate = current
    ? stripCosmos(current)
    : {
        id: userId,
        name: input.name,
        email: input.email,
        location: input.location,
        experienceYears: input.experienceYears,
        expectedSalary: input.expectedSalary,
        readinessScore: 0,
        bio: input.bio,
        skills: [],
      };
  const next: Candidate = {
    ...base,
    id: base.id || userId,
    name: input.name,
    location: input.location,
    bio: input.bio,
    experienceYears: input.experienceYears,
    expectedSalary: input.expectedSalary,
    email: input.email,
  };
  await container.items.upsert({
    ...next,
    userId,
    visibility: current?.visibility,
  });
  return next;
}

export async function setEducationListAsync(
  list: Education[],
  userId: string,
): Promise<Candidate> {
  return patchExistingSection(userId, { education: list });
}

export async function setExperienceListAsync(
  list: Experience[],
  userId: string,
): Promise<Candidate> {
  return patchExistingSection(userId, { experience: list });
}

export async function setOrganizationListAsync(
  list: OrganizationExperience[],
  userId: string,
): Promise<Candidate> {
  return patchExistingSection(userId, { organizations: list });
}

export async function setProjectListAsync(
  list: ProjectExperience[],
  userId: string,
): Promise<Candidate> {
  return patchExistingSection(userId, { projects: list });
}

export async function setAchievementListAsync(
  list: Achievement[],
  userId: string,
): Promise<Candidate> {
  return patchExistingSection(userId, { achievements: list });
}

export function newOrganizationId() {
  return uid("og");
}

export function newProjectId() {
  return uid("pj");
}

export function newAchievementId() {
  return uid("ac");
}

export async function setSkillsAsync(
  skills: CandidateSkill[],
  userId: string,
): Promise<Candidate> {
  return patchExistingSection(userId, { skills });
}

export async function mergeSkillsAsync(
  incoming: CandidateSkill[],
  userId: string,
): Promise<Candidate> {
  const existing = await readRecord(userId);
  if (!existing) {
    throw new Error(
      `Candidate profile not found for userId="${userId}". The onboarding flow should have created it.`,
    );
  }
  const byId = new Map<string, CandidateSkill>();
  for (const s of existing.skills ?? []) byId.set(s.skillId, s);
  for (const s of incoming) {
    if (!byId.has(s.skillId)) byId.set(s.skillId, s);
  }
  return patchExistingSection(userId, { skills: Array.from(byId.values()) });
}

export function calculateReadinessScore(profile: Candidate): number {
  const hasText = (value?: string) => Boolean(value?.trim());
  const skillCount = profile.skills?.length ?? 0;
  const hasEducation = (profile.education?.length ?? 0) > 0;
  const hasExperience =
    profile.experienceYears > 0 ||
    (profile.experience?.length ?? 0) > 0 ||
    (profile.organizations?.length ?? 0) > 0 ||
    (profile.projects?.length ?? 0) > 0;
  const hasContact = Boolean(
    profile.phone || profile.linkedin || profile.github || profile.portfolio,
  );
  const hasPreferences = Boolean(
    profile.preferredJobTypes?.length && profile.preferredWorkModes?.length,
  );

  let score = 0;
  if (hasText(profile.name) && hasText(profile.email) && hasText(profile.location)) {
    score += 10;
  }
  if (hasText(profile.bio)) {
    score += profile.bio.trim().length >= 40 ? 10 : 5;
  }
  if (profile.cv) score += 10;
  score += Math.min(30, skillCount * 5);
  if (hasEducation) score += 10;
  if (hasExperience) score += 15;
  if (hasContact) score += 5;
  if (hasPreferences) score += 10;

  return Math.max(0, Math.min(100, score));
}

export async function recomputeReadinessScoreAsync(
  userId: string,
): Promise<{ previousScore: number; newScore: number; increasedBy: number }> {
  const existing = await readRecord(userId);
  if (!existing) {
    return { previousScore: 0, newScore: 0, increasedBy: 0 };
  }

  const previousScore = existing.readinessScore ?? 0;
  const newScore = calculateReadinessScore(stripCosmos(existing));
  const increasedBy = Math.max(0, newScore - previousScore);

  if (newScore !== previousScore) {
    const container = getContainer(CONTAINERS.candidates);
    await container.items.upsert({
      ...existing,
      readinessScore: newScore,
    });
  }

  return { previousScore, newScore, increasedBy };
}

async function findProfileByEmailAsync(
  email: string,
): Promise<CandidateRecord | null> {
  const container = getContainer(CONTAINERS.candidates);
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const { resources } = await container.items
    .query<CandidateRecord & { _ts?: number }>({
      query: "SELECT * FROM c WHERE LOWER(c.email) = @email",
      parameters: [{ name: "@email", value: normalized }],
    })
    .fetchAll();
  if (resources.length === 0) return null;
  return resources.sort((a, b) => (b._ts ?? 0) - (a._ts ?? 0))[0];
}

export async function migrateProfileIdAsync(
  newId: string,
  email: string,
): Promise<Candidate | null> {
  const existing = await findProfileByEmailAsync(email);
  if (!existing) return null;
  if (existing.id === newId) return stripCosmos(existing);
  const container = getContainer(CONTAINERS.candidates);
  const migrated: CandidateRecord = {
    ...existing,
    id: newId,
    userId: newId,
  };
  await container.items.upsert(migrated);
  try {
    await container.item(existing.id, existing.userId ?? existing.id).delete();
  } catch (err: unknown) {
    if (!is404(err)) throw err;
  }
  return stripCosmos(migrated);
}

export async function deleteProfileAsync(userId: string): Promise<void> {
  const container = getContainer(CONTAINERS.candidates);
  try {
    await container.item(userId, userId).delete();
  } catch (err: unknown) {
    if (is404(err)) return;
    throw err;
  }
}

export type ContactInput = {
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

export async function setContactAsync(
  input: ContactInput,
  userId: string,
): Promise<Candidate> {
  return patchExistingSection(userId, {
    phone: input.phone,
    linkedin: input.linkedin,
    github: input.github,
    portfolio: input.portfolio,
  });
}

export function newEducationId() {
  return uid("ed");
}

export function newExperienceId() {
  return uid("ex");
}

export async function patchProfileAsync(
  userId: string,
  patch: (existing: CandidateRecord) => CandidateRecord,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const existing = await readRecord(userId);
  const baseline: CandidateRecord = existing ?? {
    id: userId,
    userId,
    name: "",
    email: "",
    location: "",
    experienceYears: 0,
    expectedSalary: 0,
    readinessScore: 0,
    bio: "",
    skills: [],
    visibility: "applied-only",
  };
  const next = patch(baseline);
  await container.items.upsert(next);
  return stripCosmos(next);
}

function formatMonthYear(monthIso: string, locale = "id-ID") {
  if (!monthIso) return "";
  const d = new Date(`${monthIso}-01`);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatPeriod(startMonth: string, endMonth: string) {
  const start = formatMonthYear(startMonth);
  if (!endMonth) return `${start} – sekarang`;
  return `${start} – ${formatMonthYear(endMonth)}`;
}

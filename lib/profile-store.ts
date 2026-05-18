import type {
  Candidate,
  CvFile,
  Education,
  Experience,
  JobType,
  WorkMode,
} from "./types";
import { unstable_cache } from "next/cache";
import { CONTAINERS, getContainer } from "./db";

type CandidateSkill = Candidate["skills"][number];

const ME_ID = "me";

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

export async function getProfileAsync(userId = ME_ID): Promise<Candidate | null> {
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
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: number }).code === 404
        ) {
          return null;
        }
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

export async function getProfileOrSeedAsync(userId = ME_ID): Promise<Candidate> {
  const profile = await getProfileAsync(userId);
  if (!profile) {
    throw new Error(
      `Candidate profile not found for userId="${userId}". The onboarding flow should have created it.`,
    );
  }
  return profile;
}

export type ProfileBasicInput = {
  name: string;
  location: string;
  bio: string;
  experienceYears: number;
  expectedSalary: number;
  email: string;
};

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
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 404) {
      return null;
    }
    throw err;
  }
}

export async function updateProfileBasicAsync(
  input: ProfileBasicInput,
  userId = ME_ID,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const current = await readRecord(userId);
  // Build a baseline candidate when this is the first write (post-onboarding).
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
  userId = ME_ID,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const current = await getProfileOrSeedAsync(userId);
  const existing = await readRecord(userId);
  const next: Candidate = { ...current, id: current.id || userId, education: list };
  await container.items.upsert({
    ...next,
    userId,
    visibility: existing?.visibility,
  });
  return next;
}

export async function setExperienceListAsync(
  list: Experience[],
  userId = ME_ID,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const current = await getProfileOrSeedAsync(userId);
  const existing = await readRecord(userId);
  const next: Candidate = { ...current, id: current.id || userId, experience: list };
  await container.items.upsert({
    ...next,
    userId,
    visibility: existing?.visibility,
  });
  return next;
}

export async function setCvAsync(cv: CvFile, userId = ME_ID): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const current = await getProfileOrSeedAsync(userId);
  const existing = await readRecord(userId);
  const next: Candidate = { ...current, id: current.id || userId, cv };
  await container.items.upsert({
    ...next,
    userId,
    visibility: existing?.visibility,
  });
  return next;
}

// Replace the candidate's skill list outright. Used by onboarding when seeding
// a fresh profile.
export async function setSkillsAsync(
  skills: CandidateSkill[],
  userId = ME_ID,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const current = await getProfileOrSeedAsync(userId);
  const existing = await readRecord(userId);
  const next: Candidate = { ...current, id: current.id || userId, skills };
  await container.items.upsert({
    ...next,
    userId,
    visibility: existing?.visibility,
  });
  return next;
}

// Merge incoming skills into the existing list. New skill ids are appended;
// existing ids keep the highest level seen so CV uploads can't accidentally
// downgrade a skill the user already proved via assessment.
export async function mergeSkillsAsync(
  incoming: CandidateSkill[],
  userId = ME_ID,
): Promise<Candidate> {
  const current = await getProfileOrSeedAsync(userId);
  const byId = new Map<string, CandidateSkill>();
  for (const s of current.skills ?? []) byId.set(s.skillId, s);
  for (const s of incoming) {
    const existing = byId.get(s.skillId);
    if (!existing || s.level > existing.level) byId.set(s.skillId, s);
  }
  return setSkillsAsync(Array.from(byId.values()), userId);
}

// Hard delete the candidate profile row. Tolerates 404 (already gone).
export async function deleteProfileAsync(userId: string): Promise<void> {
  const container = getContainer(CONTAINERS.candidates);
  try {
    await container.item(userId, userId).delete();
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 404
    ) {
      return;
    }
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
  userId = ME_ID,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const current = await getProfileOrSeedAsync(userId);
  const existing = await readRecord(userId);
  const next: Candidate = {
    ...current,
    id: current.id || userId,
    phone: input.phone,
    linkedin: input.linkedin,
    github: input.github,
    portfolio: input.portfolio,
  };
  await container.items.upsert({
    ...next,
    userId,
    visibility: existing?.visibility,
  });
  return next;
}

export type ProfilePreferencesInput = {
  preferredJobTypes?: JobType[];
  preferredWorkModes?: WorkMode[];
  preferredCities?: string[];
  industries?: string[];
  location?: string;
  expectedSalary?: number;
};

export async function setPreferencesAsync(
  input: ProfilePreferencesInput,
  userId = ME_ID,
): Promise<Candidate> {
  const container = getContainer(CONTAINERS.candidates);
  const existing = await readRecord(userId);
  const base: Candidate = existing
    ? stripCosmos(existing)
    : {
        id: userId,
        name: "",
        email: "",
        location: input.location ?? "",
        experienceYears: 0,
        expectedSalary: input.expectedSalary ?? 0,
        readinessScore: 0,
        bio: "",
        skills: [],
      };
  const next: Candidate = {
    ...base,
    id: base.id || userId,
    location: input.location ?? base.location,
    expectedSalary: input.expectedSalary ?? base.expectedSalary,
    preferredJobTypes: input.preferredJobTypes ?? base.preferredJobTypes,
    preferredWorkModes: input.preferredWorkModes ?? base.preferredWorkModes,
    preferredCities: input.preferredCities ?? base.preferredCities,
    industries: input.industries ?? base.industries,
  };
  await container.items.upsert({
    ...next,
    userId,
    visibility: existing?.visibility,
  });
  return next;
}

export function newEducationId() {
  return uid("ed");
}

export function newExperienceId() {
  return uid("ex");
}

export async function setVisibilityAsync(
  v: Visibility,
  userId = ME_ID,
): Promise<void> {
  const container = getContainer(CONTAINERS.candidates);
  const existing = await readRecord(userId);
  if (!existing) {
    throw new Error(
      `Candidate profile not found for userId="${userId}". Cannot set visibility before profile exists.`,
    );
  }
  await container.items.upsert({ ...existing, visibility: v });
}

// Format helpers, used in UI.
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

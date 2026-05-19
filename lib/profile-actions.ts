"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { deleteBlob, isBlobConfigured, uploadCv } from "./blob-store";
import {
  deleteProfileAsync,
  getProfileOrSeedAsync,
  mergeSkillsAsync,
  newEducationId,
  newExperienceId,
  patchProfileAsync,
  profileCacheTag,
  setContactAsync,
  setCvAsync,
  setEducationListAsync,
  setExperienceListAsync,
  setSkillsAsync,
  updateProfileBasicAsync,
} from "./profile-store";
import { recordAttempt as recordAttemptStore } from "./attempts-store";
import { getAssessmentBySlugAsync } from "./assessments-store";
import { parseCv } from "./cv-parser";
import { requireUser } from "./session";
import { deleteUserById } from "./user-store";
import { refreshProfileVector } from "./profile-summary";
import {
  gatherFeedbackContext,
  generateAssessmentFeedback,
} from "./assessment-feedback";
import { searchJobs } from "./search-store";
import { skillById } from "./skills";
import type {
  Education,
  Experience,
  JobType,
  WorkMode,
} from "./types";

// Recompute the profile embedding off the request path so saves stay fast.
// Failures are swallowed inside refreshProfileVector — we only need the call
// to complete eventually.
function scheduleProfileEmbed(userId: string): void {
  // Defer to next tick so the response can flush before the Gemini call
  // (~800-1500ms) blocks the request. Failures are logged but never surface
  // to the user; the vector regenerates on the next mutation.
  setTimeout(() => {
    refreshProfileVector(userId).catch((err) => {
      console.error(
        "[profile-actions] background embed failed for",
        userId,
        err,
      );
    });
  }, 0);
}

function revalidateProfileSurfaces() {
  // Profile-relevant changes invalidate every surface that ranks or displays
  // the candidate. We also kick off a vector refresh here so any user-facing
  // mutation that revalidates UI also keeps the embedding current.
  scheduleProfileEmbed("me");
  revalidateTag(profileCacheTag("me"));
  revalidatePath("/app/profil");
  revalidatePath("/app");
  revalidatePath("/app/lowongan");
  revalidatePath("/app/lowongan/[id]", "page");
}

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function asInt(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

// CV upload via Azure Blob; jatuh ke metadata-only kalau Blob belum dikonfig.
export type ParsedCvPreview = {
  filename: string;
  sizeBytes: number;
  blobName?: string;
  contentType: string;
  skills: { id: string; name: string }[];
  education: {
    institution: string;
    degree: string;
    startMonth?: string;
    endMonth?: string;
    notes?: string;
  }[];
  experience: {
    position: string;
    company: string;
    startMonth?: string;
    endMonth?: string;
    duties?: string;
  }[];
  notes: string[];
};

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function uploadCvForReview(
  formData: FormData,
): Promise<ParsedCvPreview | { error: string }> {
  const file = formData.get("cv");
  if (!(file instanceof File)) {
    return { error: "Tidak ada file yang diupload." };
  }
  if (file.size === 0) {
    return { error: "File kosong, coba upload ulang." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return {
      error: "File lebih besar dari 5 MB. Kompres dulu atau pilih format lain.",
    };
  }
  if (
    !ALLOWED_CONTENT_TYPES.includes(file.type) &&
    !file.name.match(/\.(pdf|docx?|doc)$/i)
  ) {
    return { error: "Format tidak didukung. Pakai PDF, DOC, atau DOCX." };
  }

  const user = await requireUser();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = file.type || "application/octet-stream";

  let blobName: string | undefined;
  if (isBlobConfigured()) {
    try {
      const result = await uploadCv(buffer, file.name, user.id, contentType);
      blobName = result.blobName;
    } catch (err) {
      console.error("[cv] Blob upload failed:", err);
      return {
        error: "Gagal mengunggah CV ke storage. Coba lagi sebentar.",
      };
    }
  }

  try {
    const parsed = await parseCv({
      buffer,
      contentType,
      filename: file.name,
    });

    return {
      filename: file.name,
      sizeBytes: file.size,
      blobName,
      contentType,
      skills: parsed.skills,
      education: parsed.education,
      experience: parsed.experience,
      notes: parsed.notes,
    };
  } catch (err) {
    console.error("[cv-parser] Engine failed:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Parser CV gagal memproses file. Coba lagi atau hubungi admin.",
    };
  }
}

export type ConfirmCvInput = {
  filename: string;
  sizeBytes: number;
  blobName?: string;
  contentType?: string;
  extractedSkills?: { id: string; name: string }[];
  extractedEducation?: ParsedCvPreview["education"];
  extractedExperience?: ParsedCvPreview["experience"];
};

export async function confirmCvUpdate(input: ConfirmCvInput) {
  if (!input.filename) return;
  const user = await requireUser();

  await setCvAsync(
    {
      filename: input.filename,
      sizeBytes: input.sizeBytes,
      uploadedAt: new Date().toISOString(),
      blobName: input.blobName,
      contentType: input.contentType,
    },
    user.id,
  );

  if (input.extractedSkills && input.extractedSkills.length > 0) {
    await mergeSkillsAsync(
      input.extractedSkills.map((s) => ({
        skillId: s.id,
        name: s.name,
      })),
      user.id,
    );
  }

  if (input.extractedEducation && input.extractedEducation.length > 0) {
    const education: Education[] = input.extractedEducation.map((e) => ({
      id: newEducationId(),
      institution: e.institution,
      degree: e.degree,
      startMonth: e.startMonth ?? "",
      endMonth: e.endMonth ?? "",
      notes: e.notes,
    }));
    await setEducationListAsync(education, user.id);
  }

  if (input.extractedExperience && input.extractedExperience.length > 0) {
    const experience: Experience[] = input.extractedExperience.map((e) => ({
      id: newExperienceId(),
      position: e.position,
      company: e.company,
      startMonth: e.startMonth ?? "",
      endMonth: e.endMonth ?? "",
      duties: e.duties,
    }));
    await setExperienceListAsync(experience, user.id);
  }

  revalidateProfileSurfaces();
  redirect("/app/profil?cv=1");
}

export async function deleteCandidateAccount() {
  const user = await requireUser();
  const profile = await getProfileOrSeedAsync(user.id).catch(() => null);
  const blobName = profile?.cv?.blobName;
  if (blobName && isBlobConfigured()) {
    try {
      await deleteBlob(blobName);
    } catch (err) {
      console.error("[delete] Blob cleanup failed:", err);
    }
  }
  await deleteProfileAsync(user.id);
  await deleteUserById(user.id);
  await signOut({ redirect: false });
  redirect("/?account-deleted=1");
}

// ----- Section save actions (used by ProfileEditUI) -----

export type PersonalInput = {
  name: string;
  email: string;
  location: string;
  bio: string;
  experienceYears?: number;
  expectedSalary?: number;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

export type SectionResult =
  | { ok: true }
  | { ok: false; error: string };

function failSection(errors: Record<string, string>): SectionResult {
  return {
    ok: false,
    error: Object.values(errors)[0] ?? "Periksa kembali isian.",
  };
}

export async function savePersonalSection(
  input: PersonalInput,
): Promise<SectionResult> {
  const errors: Record<string, string> = {};
  if (!input.name?.trim()) errors.name = "Nama tidak boleh kosong.";
  if (!input.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    errors.email = "Email tidak valid.";
  if (input.bio && input.bio.length > 280)
    errors.bio = "Bio terlalu panjang, batasi 280 karakter.";
  const expYears = input.experienceYears ?? 0;
  const expSalary = input.expectedSalary ?? 0;
  if (expYears < 0 || expYears > 60)
    errors.experienceYears = "Isi 0 sampai 60 tahun.";
  if (expSalary < 0)
    errors.expectedSalary = "Ekspektasi gaji tidak boleh negatif.";
  if (Object.keys(errors).length > 0) return failSection(errors);

  const user = await requireUser();
  await updateProfileBasicAsync(
    {
      name: input.name,
      email: input.email,
      location: input.location,
      bio: input.bio,
      experienceYears: input.experienceYears ?? 0,
      expectedSalary: input.expectedSalary ?? 0,
    },
    user.id,
  );
  await setContactAsync(
    {
      phone: input.phone,
      linkedin: input.linkedin,
      github: input.github,
      portfolio: input.portfolio,
    },
    user.id,
  );
  revalidateProfileSurfaces();
  return { ok: true };
}

export type EducationDraft = {
  id?: string;
  institution: string;
  degree: string;
  startMonth?: string;
  endMonth?: string;
  notes?: string;
  gpa?: string;
};

export async function saveEducationSection(
  drafts: EducationDraft[],
): Promise<SectionResult> {
  const errors: Record<string, string> = {};
  const cleaned: Education[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const institution = d.institution?.trim() ?? "";
    const degree = d.degree?.trim() ?? "";
    if (!institution && !degree) continue;
    if (!institution || !degree) {
      errors[`edu-${i}`] = "Institusi dan gelar wajib diisi.";
      continue;
    }
    cleaned.push({
      id: d.id || newEducationId(),
      institution,
      degree,
      startMonth: d.startMonth || "",
      endMonth: d.endMonth || "",
      gpa: d.gpa?.trim() || undefined,
      notes: d.notes?.trim() || undefined,
    });
  }
  if (Object.keys(errors).length > 0) return failSection(errors);
  const user = await requireUser();
  await setEducationListAsync(cleaned, user.id);
  revalidateProfileSurfaces();
  return { ok: true };
}

export type ExperienceDraft = {
  id?: string;
  position: string;
  company: string;
  startMonth?: string;
  endMonth?: string;
  duties?: string;
};

export async function saveExperienceSection(
  drafts: ExperienceDraft[],
): Promise<SectionResult> {
  const errors: Record<string, string> = {};
  const cleaned: Experience[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const position = d.position?.trim() ?? "";
    const company = d.company?.trim() ?? "";
    if (!position && !company) continue;
    if (!position || !company) {
      errors[`exp-${i}`] = "Posisi dan perusahaan wajib diisi.";
      continue;
    }
    cleaned.push({
      id: d.id || newExperienceId(),
      position,
      company,
      startMonth: d.startMonth || "",
      endMonth: d.endMonth || "",
      duties: d.duties?.trim() || undefined,
    });
  }
  if (Object.keys(errors).length > 0) return failSection(errors);
  const user = await requireUser();
  await setExperienceListAsync(cleaned, user.id);
  revalidateProfileSurfaces();
  return { ok: true };
}

export type SkillDraft = {
  id: string;
  name?: string;
};

export async function saveSkillsSection(
  drafts: SkillDraft[],
): Promise<SectionResult> {
  const cleaned = drafts
    .filter((d) => d.id && d.id.trim().length > 0)
    .map((d) => ({
      skillId: d.id,
      name: d.name,
    }));
  const user = await requireUser();
  await setSkillsAsync(cleaned, user.id);
  revalidateProfileSurfaces();
  return { ok: true };
}

export type PreferencesDraft = {
  preferredJobTypes: JobType[];
  preferredWorkModes: WorkMode[];
  preferredCities: string[];
  industries: string[];
};

export async function savePreferencesSection(
  draft: PreferencesDraft,
): Promise<SectionResult> {
  const errors: Record<string, string> = {};
  if (!Array.isArray(draft.preferredJobTypes) || draft.preferredJobTypes.length === 0) {
    errors.preferredJobTypes = "Pilih minimal satu tipe pekerjaan.";
  }
  if (!Array.isArray(draft.preferredWorkModes) || draft.preferredWorkModes.length === 0) {
    errors.preferredWorkModes = "Pilih minimal satu mode kerja.";
  }
  if (!Array.isArray(draft.preferredCities) || draft.preferredCities.length === 0) {
    errors.preferredCities = "Pilih minimal satu kota.";
  }
  if (!Array.isArray(draft.industries) || draft.industries.length === 0) {
    errors.industries = "Pilih minimal satu industri yang diminati.";
  }
  if (Object.keys(errors).length > 0) return failSection(errors);

  const user = await requireUser();
  const primaryCity = draft.preferredCities[0] ?? "";
  await patchProfileAsync(user.id, (base) => ({
    ...base,
    preferredJobTypes: draft.preferredJobTypes,
    preferredWorkModes: draft.preferredWorkModes,
    preferredCities: draft.preferredCities,
    industries: draft.industries,
    // Keep top-level location synced with primary preferred city so other
    // surfaces (location chip, AppShell sidebar) reflect the change too.
    location: primaryCity || base.location,
  }));
  revalidateProfileSurfaces();
  return { ok: true };
}

// ----- Onboarding -----

export type OnboardingPreferencesInput = {
  preferredJobTypes: JobType[];
  preferredWorkModes: WorkMode[];
  preferredCities: string[];
  industries: string[];
};

export type OnboardingInput = {
  preferences: OnboardingPreferencesInput;
  cv?: {
    filename: string;
    sizeBytes: number;
    blobName?: string;
    contentType?: string;
    skills: { id: string; name: string }[];
    education: ParsedCvPreview["education"];
    experience: ParsedCvPreview["experience"];
  };
};

export async function completeOnboarding(input: OnboardingInput) {
  const user = await requireUser();
  const name = user.name ?? "Pencari Kerja";
  const email = user.email ?? "";
  const prefs = input.preferences;
  const primaryCity = prefs.preferredCities[0] ?? "";

  const cv = input.cv;
  const education =
    cv?.education.map((e) => ({
      id: newEducationId(),
      institution: e.institution,
      degree: e.degree,
      startMonth: e.startMonth ?? "",
      endMonth: e.endMonth ?? "",
      notes: e.notes,
    })) ?? [];
  const experience =
    cv?.experience.map((e) => ({
      id: newExperienceId(),
      position: e.position,
      company: e.company,
      startMonth: e.startMonth ?? "",
      endMonth: e.endMonth ?? "",
      duties: e.duties,
    })) ?? [];
  const totalMonths = experience.reduce(
    (acc, e) => acc + monthsBetween(e.startMonth, e.endMonth),
    0,
  );
  const experienceYears = Math.max(0, Math.round(totalMonths / 12));
  const skills =
    cv?.skills.map((s) => ({
      skillId: s.id,
      name: s.name,
    })) ?? [];

  await patchProfileAsync(user.id, (base) => ({
    ...base,
    id: user.id,
    userId: user.id,
    name,
    email,
    location: primaryCity,
    bio: base.bio ?? "",
    experienceYears,
    expectedSalary: base.expectedSalary ?? 0,
    readinessScore: base.readinessScore ?? 0,
    preferredJobTypes: prefs.preferredJobTypes,
    preferredWorkModes: prefs.preferredWorkModes,
    preferredCities: prefs.preferredCities,
    industries: prefs.industries,
    skills: skills.length > 0 ? skills : base.skills ?? [],
    education: education.length > 0 ? education : base.education,
    experience: experience.length > 0 ? experience : base.experience,
    cv: cv
      ? {
          filename: cv.filename,
          sizeBytes: cv.sizeBytes,
          uploadedAt: new Date().toISOString(),
          blobName: cv.blobName,
          contentType: cv.contentType,
        }
      : base.cv,
    visibility: base.visibility ?? "applied-only",
  }));

  // Block on the embedding so the dashboard render right after onboarding has
  // a real profileVector. Without this the first /app render falls back to
  // BM25 + score-only ranking, which makes top recommendations look generic
  // for the most important moment of the funnel. Failures are non-fatal: the
  // next mutation will retry, and search degrades gracefully.
  try {
    await refreshProfileVector(user.id);
  } catch (err) {
    console.error(
      "[onboarding] profile vector refresh failed (non-fatal):",
      err,
    );
  }

  revalidateTag(profileCacheTag(user.id));
  revalidatePath("/app");
  revalidatePath("/app/profil");
}

// ----- Assessments -----

export async function submitAssessmentAttempt(input: {
  slug: string;
  correct: number;
  total: number;
}):
  | Promise<
      | {
          ok: true;
          score: number;
          correct: number;
          total: number;
          passed: boolean;
          feedback: string;
        }
      | { ok: false; error: string }
    > {
  const user = await requireUser();
  const assessment = await getAssessmentBySlugAsync(input.slug);
  if (!assessment)
    return { ok: false as const, error: "Assessment tidak ditemukan." };
  const score =
    input.total > 0 ? Math.round((input.correct / input.total) * 100) : 0;
  const passed = score >= 50;
  await recordAttemptStore({
    userId: user.id,
    skillId: assessment.skillId,
    assessmentId: assessment.id,
    assessmentSlug: input.slug,
    correct: input.correct,
    total: input.total,
  });
  revalidateTag(profileCacheTag(user.id));
  revalidatePath("/app/assessment");
  revalidatePath("/app/profil");

  // Generate personal feedback. This adds 1-3s but turns a numeric score into
  // an actionable next step, which is the whole point of an assessment in an
  // upskilling app. Failures fall back to a static template inside the lib.
  const skillName = skillById[assessment.skillId]?.name ?? assessment.skillId;
  let feedback = "";
  try {
    const profile = await getProfileOrSeedAsync(user.id);
    const search = await searchJobs({
      top: 20,
      profileVector: profile.profileVector,
      includeClosed: false,
    });
    const ctx = await gatherFeedbackContext(
      profile,
      assessment.skillId,
      search.jobs,
    );
    feedback = await generateAssessmentFeedback({
      profile,
      skillId: assessment.skillId,
      skillName,
      score,
      passed,
      correct: input.correct,
      total: input.total,
      topJobsRequiringSkill: ctx.jobs,
      recommendedCourses: ctx.courses,
    });
  } catch (err) {
    console.warn("[assessment] feedback generation failed:", err);
  }

  return {
    ok: true as const,
    score,
    correct: input.correct,
    total: input.total,
    passed,
    feedback,
  };
}

function monthsBetween(startMonth?: string, endMonth?: string): number {
  if (!startMonth) return 0;
  const start = parseMonth(startMonth);
  if (!start) return 0;
  const end = endMonth ? parseMonth(endMonth) : new Date();
  if (!end) return 0;
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

function parseMonth(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1);
}

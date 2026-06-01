"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import {
  deleteBlob,
  isBlobConfigured,
  uploadCv,
  uploadPracticeEvidence,
} from "../infra/blob-store";
import {
  deleteProfileAsync,
  getProfileAsync,
  mergeSkillsAsync,
  newEducationId,
  newExperienceId,
  newOrganizationId,
  newProjectId,
  newAchievementId,
  patchProfileAsync,
  profileCacheTag,
  recomputeReadinessScoreAsync,
  setContactAsync,
  setEducationListAsync,
  setExperienceListAsync,
  setOrganizationListAsync,
  setProjectListAsync,
  setAchievementListAsync,
  setSkillsAsync,
  updateProfileBasicAsync,
} from "./profile-store";
import { recordPracticeAttempt } from "../learning/attempts-store";
import { getPracticeTaskBySlugAsync } from "../learning/practice-store";
import { getJobByIdAsync } from "../jobs/jobs-store";
import { parseCv } from "./cv-parser";
import {
  analyzeParsedCvWithLanguage,
  cvLanguageInsightNotes,
} from "../ai/azure-language";
import { requireUser } from "../auth/session";
import { deleteUserById } from "../auth/user-store";
import { refreshProfileVector } from "./profile-summary";
import { scheduleLearningPrewarmForProfile } from "../learning/learning-prewarm";
import {
  calculatePracticeScore,
  gradePracticeAnswer,
  levelFromPracticeScore,
} from "../learning/practice-grading";
import { gradePracticeAnswerWithAi } from "../learning/practice-ai-grading";
import {
  buildExcelPracticeEvidenceText,
  looksLikeXlsx,
  parseExcelPracticeWorkbook,
} from "../learning/practice-excel";
import {
  EXCEL_PRACTICE_CONTENT_TYPE,
  EXCEL_PRACTICE_MAX_BYTES,
  formatPracticeFileSize,
  isExcelPracticeSubmission,
  resolvePracticeSubmission,
} from "../learning/practice-submission";
import { skillById, skillDisplayName } from "../learning/skills";
import type {
  Education,
  Experience,
  JobType,
  OrganizationExperience,
  ProjectExperience,
  WorkMode,
  CvLanguageInsights,
  PracticeEvidenceFile,
} from "../shared/types";

function scheduleProfileEmbed(userId: string): void {
  after(async () => {
    try {
      await refreshProfileVector(userId);
    } catch (err) {
      console.error(
        "[profile-actions] background embed failed for",
        userId,
        err,
      );
    }
  });
}

function revalidateProfileSurfaces(
  userId: string,
  options: { embedding?: boolean } = {},
) {
  if (options.embedding) {
    scheduleProfileEmbed(userId);
  }
  revalidateTag(profileCacheTag(userId));
  revalidateTag(`ranked-jobs:${userId}`);
  revalidatePath("/app/profil");
  revalidatePath("/app");
  revalidatePath("/app/lowongan");
}

async function refreshProfileScore(
  userId: string,
  options: { embedding?: boolean } = {},
) {
  try {
    await recomputeReadinessScoreAsync(userId);
  } catch (err) {
    console.error("[profile-actions] readiness recompute failed", err);
  }
  revalidateProfileSurfaces(userId, options);
}

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function asInt(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
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

export type ParsedCvPreview = {
  filename: string;
  sizeBytes: number;
  blobName?: string;
  contentType: string;
  personal: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    bio?: string;
  };
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
  organizations: {
    role: string;
    organization: string;
    startMonth?: string;
    endMonth?: string;
    duties?: string;
  }[];
  projects: {
    title: string;
    context?: string;
    startMonth?: string;
    endMonth?: string;
    duties?: string;
    link?: string;
  }[];
  achievements: {
    title: string;
    year: string;
    description?: string;
  }[];
  languageInsights?: CvLanguageInsights;
  notes: string[];
};

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function detectFileSignature(
  buffer: Buffer,
): "pdf" | "docx" | "doc" | "unknown" {
  if (buffer.length < 4) return "unknown";
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "pdf";
  }
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return "docx";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return "doc";
  }
  return "unknown";
}

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

  const signature = detectFileSignature(buffer);
  if (signature === "unknown") {
    return {
      error:
        "File tidak terbaca sebagai PDF, DOC, atau DOCX. Pastikan ekstensi sesuai isinya.",
    };
  }
  const contentType =
    signature === "pdf"
      ? "application/pdf"
      : signature === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";

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
    let languageInsights: CvLanguageInsights | undefined;
    try {
      languageInsights = await analyzeParsedCvWithLanguage(parsed);
    } catch (err) {
      console.warn("[cv] language insights failed:", err);
    }

    return {
      filename: file.name,
      sizeBytes: file.size,
      blobName,
      contentType,
      personal: parsed.personal,
      skills: parsed.skills,
      education: parsed.education,
      experience: parsed.experience,
      organizations: parsed.organizations,
      projects: parsed.projects,
      achievements: parsed.achievements,
      languageInsights,
      notes: [...parsed.notes, ...cvLanguageInsightNotes(languageInsights)],
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

export async function discardCvPreview(blobName: string) {
  if (!blobName) return;
  const user = await requireUser();
  if (!isBlobConfigured()) return;
  if (!blobName.includes("/")) return;
  if (!blobName.startsWith(`${user.id}/`)) return;
  try {
    await deleteBlob(blobName);
  } catch (err) {
    console.error("[cv] discard preview failed", err);
  }
}

export type ConfirmCvInput = {
  filename: string;
  sizeBytes: number;
  blobName?: string;
  contentType?: string;
  extractedPersonal?: ParsedCvPreview["personal"];
  extractedSkills?: { id: string; name: string }[];
  extractedEducation?: ParsedCvPreview["education"];
  extractedExperience?: ParsedCvPreview["experience"];
  extractedOrganizations?: ParsedCvPreview["organizations"];
  extractedProjects?: ParsedCvPreview["projects"];
  extractedAchievements?: ParsedCvPreview["achievements"];
  languageInsights?: CvLanguageInsights;
};

export async function confirmCvUpdate(input: ConfirmCvInput) {
  if (!input.filename) return;
  const user = await requireUser();

  const skills = (input.extractedSkills ?? []).map((s) => ({
    skillId: s.id,
    name: s.name,
  }));
  const education = (input.extractedEducation ?? []).map((e) => ({
    id: newEducationId(),
    institution: e.institution,
    degree: e.degree,
    startMonth: e.startMonth ?? "",
    endMonth: e.endMonth ?? "",
    notes: e.notes,
  }));
  const experience = (input.extractedExperience ?? []).map((e) => ({
    id: newExperienceId(),
    position: e.position,
    company: e.company,
    startMonth: e.startMonth ?? "",
    endMonth: e.endMonth ?? "",
    duties: e.duties,
  }));
  const organizations = (input.extractedOrganizations ?? []).map((o) => ({
    id: newOrganizationId(),
    role: o.role,
    organization: o.organization,
    startMonth: o.startMonth ?? "",
    endMonth: o.endMonth ?? "",
    duties: o.duties,
  }));
  const projects = (input.extractedProjects ?? []).map((p) => ({
    id: newProjectId(),
    title: p.title,
    context: p.context,
    startMonth: p.startMonth ?? "",
    endMonth: p.endMonth ?? "",
    duties: p.duties,
    link: p.link,
  }));
  const achievements = (input.extractedAchievements ?? []).map((a) => ({
    id: newAchievementId(),
    title: a.title,
    year: a.year,
    description: a.description,
  }));
  const totalMonths = experience.reduce(
    (acc, e) => acc + monthsBetween(e.startMonth, e.endMonth),
    0,
  );
  const experienceYears = Math.max(0, Math.round(totalMonths / 12));

  const previousProfile = await getProfileAsync(user.id);
  const previousBlobName = previousProfile?.cv?.blobName;
  const accountEmail = user.email ?? previousProfile?.email ?? "";

  const personal = input.extractedPersonal ?? {};
  const cvEmail = personal.email?.trim();
  const resolvedEmail = cvEmail && cvEmail.length > 0 ? cvEmail : accountEmail;

  // Replace semantics: a fresh CV is the new source of truth, so all
  // CV-derived sections are overwritten as a unit. Personal fields use
  // "fallback to existing if CV blank" so we don't wipe data the user typed
  // manually with an empty CV value.
  const updatedProfile = await patchProfileAsync(user.id, (base) => ({
    ...base,
    name: personal.name?.trim() || base.name,
    email: resolvedEmail || base.email,
    phone: personal.phone?.trim() || undefined,
    location: personal.location?.trim() || base.location,
    linkedin: personal.linkedin?.trim() || undefined,
    github: personal.github?.trim() || undefined,
    portfolio: personal.portfolio?.trim() || undefined,
    bio: personal.bio?.trim() || "",
    skills,
    education,
    experience,
    organizations,
    projects,
    achievements,
    experienceYears,
    cv: {
      filename: input.filename,
      sizeBytes: input.sizeBytes,
      uploadedAt: new Date().toISOString(),
      blobName: input.blobName,
      contentType: input.contentType,
      languageInsights: input.languageInsights,
    },
  }));

  if (
    previousBlobName &&
    previousBlobName !== input.blobName &&
    isBlobConfigured()
  ) {
    try {
      await deleteBlob(previousBlobName);
    } catch (err) {
      console.error("[cv] previous blob cleanup failed:", err);
    }
  }

  try {
    await recomputeReadinessScoreAsync(user.id);
  } catch (err) {
    console.error("[cv] readiness recompute failed (non-fatal):", err);
  }
  try {
    await refreshProfileVector(user.id);
  } catch (err) {
    console.error("[cv] profile vector refresh failed (non-fatal):", err);
  }
  revalidateProfileSurfaces(user.id);
  scheduleLearningPrewarmForProfile(updatedProfile);
  redirect("/app/profil?cv=1");
}

export async function deleteCandidateAccount() {
  const user = await requireUser();
  const profile = await getProfileAsync(user.id);
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

export type SectionResult = { ok: true } | { ok: false; error: string };

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
  if (input.bio && input.bio.length > 2000)
    errors.bio = "Bio terlalu panjang, batasi 2000 karakter.";
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
  await refreshProfileScore(user.id, { embedding: true });
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
  await refreshProfileScore(user.id, { embedding: true });
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
  await refreshProfileScore(user.id, { embedding: true });
  return { ok: true };
}

export type OrganizationDraft = {
  id?: string;
  role: string;
  organization: string;
  startMonth?: string;
  endMonth?: string;
  duties?: string;
};

export async function saveOrganizationSection(
  drafts: OrganizationDraft[],
): Promise<SectionResult> {
  const errors: Record<string, string> = {};
  const cleaned: OrganizationExperience[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const role = d.role?.trim() ?? "";
    const organization = d.organization?.trim() ?? "";
    if (!role && !organization) continue;
    if (!role || !organization) {
      errors[`org-${i}`] = "Posisi dan organisasi wajib diisi.";
      continue;
    }
    cleaned.push({
      id: d.id || newOrganizationId(),
      role,
      organization,
      startMonth: d.startMonth || "",
      endMonth: d.endMonth || "",
      duties: d.duties?.trim() || undefined,
    });
  }
  if (Object.keys(errors).length > 0) return failSection(errors);
  const user = await requireUser();
  await setOrganizationListAsync(cleaned, user.id);
  await refreshProfileScore(user.id, { embedding: true });
  return { ok: true };
}

export type ProjectDraft = {
  id?: string;
  title: string;
  context?: string;
  startMonth?: string;
  endMonth?: string;
  duties?: string;
  link?: string;
};

export async function saveProjectSection(
  drafts: ProjectDraft[],
): Promise<SectionResult> {
  const errors: Record<string, string> = {};
  const cleaned: ProjectExperience[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const title = d.title?.trim() ?? "";
    if (!title) continue;
    cleaned.push({
      id: d.id || newProjectId(),
      title,
      context: d.context?.trim() || undefined,
      startMonth: d.startMonth || "",
      endMonth: d.endMonth || "",
      duties: d.duties?.trim() || undefined,
      link: d.link?.trim() || undefined,
    });
  }
  if (Object.keys(errors).length > 0) return failSection(errors);
  const user = await requireUser();
  await setProjectListAsync(cleaned, user.id);
  await refreshProfileScore(user.id, { embedding: true });
  return { ok: true };
}

export type AchievementDraft = {
  id?: string;
  title?: string;
  year?: string;
  description?: string;
};

export async function saveAchievementSection(
  drafts: AchievementDraft[],
): Promise<SectionResult> {
  const cleaned: {
    id: string;
    title: string;
    year: string;
    description?: string;
  }[] = [];
  for (const d of drafts) {
    const title = d.title?.trim() ?? "";
    if (!title) continue;
    cleaned.push({
      id: d.id || newAchievementId(),
      title,
      year: d.year?.trim() || "",
      description: d.description?.trim() || undefined,
    });
  }
  const user = await requireUser();
  await setAchievementListAsync(cleaned, user.id);
  await refreshProfileScore(user.id, { embedding: true });
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
  await refreshProfileScore(user.id, { embedding: true });
  return { ok: true };
}

export type PreferencesDraft = {
  preferredJobTypes: JobType[];
  preferredWorkModes: WorkMode[];
};

export async function savePreferencesSection(
  draft: PreferencesDraft,
): Promise<SectionResult> {
  const errors: Record<string, string> = {};
  if (
    !Array.isArray(draft.preferredJobTypes) ||
    draft.preferredJobTypes.length === 0
  ) {
    errors.preferredJobTypes = "Pilih minimal satu tipe pekerjaan.";
  }
  if (
    !Array.isArray(draft.preferredWorkModes) ||
    draft.preferredWorkModes.length === 0
  ) {
    errors.preferredWorkModes = "Pilih minimal satu mode kerja.";
  }
  if (Object.keys(errors).length > 0) return failSection(errors);

  const user = await requireUser();
  await patchProfileAsync(user.id, (base) => ({
    ...base,
    preferredJobTypes: draft.preferredJobTypes,
    preferredWorkModes: draft.preferredWorkModes,
  }));
  await refreshProfileScore(user.id);
  return { ok: true };
}

// ----- Onboarding -----

export type OnboardingPreferencesInput = {
  preferredJobTypes: JobType[];
  preferredWorkModes: WorkMode[];
};

export type OnboardingInput = {
  preferences: OnboardingPreferencesInput;
  cv?: {
    filename: string;
    sizeBytes: number;
    blobName?: string;
    contentType?: string;
    personal: ParsedCvPreview["personal"];
    skills: { id: string; name: string }[];
    education: ParsedCvPreview["education"];
    experience: ParsedCvPreview["experience"];
    organizations: ParsedCvPreview["organizations"];
    projects: ParsedCvPreview["projects"];
    achievements: ParsedCvPreview["achievements"];
    languageInsights?: CvLanguageInsights;
  };
};

export async function completeOnboarding(input: OnboardingInput) {
  const user = await requireUser();
  const accountName = user.name ?? "Pencari Kerja";
  const accountEmail = user.email ?? "";
  const prefs = input.preferences;

  const cv = input.cv;
  const cvPersonal = cv?.personal ?? {};
  const cvEmail = cvPersonal.email?.trim();
  const resolvedEmail = cvEmail && cvEmail.length > 0 ? cvEmail : accountEmail;
  const resolvedName = cvPersonal.name?.trim() || accountName;
  const resolvedLocation = cvPersonal.location?.trim() || "";
  const resolvedBio = cvPersonal.bio?.trim() ?? "";
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
  const organizations =
    cv?.organizations.map((o) => ({
      id: newOrganizationId(),
      role: o.role,
      organization: o.organization,
      startMonth: o.startMonth ?? "",
      endMonth: o.endMonth ?? "",
      duties: o.duties,
    })) ?? [];
  const projects =
    cv?.projects.map((p) => ({
      id: newProjectId(),
      title: p.title,
      context: p.context,
      startMonth: p.startMonth ?? "",
      endMonth: p.endMonth ?? "",
      duties: p.duties,
      link: p.link,
    })) ?? [];
  const achievements =
    cv?.achievements.map((a) => ({
      id: newAchievementId(),
      title: a.title,
      year: a.year,
      description: a.description,
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

  const updatedProfile = await patchProfileAsync(user.id, (base) => ({
    ...base,
    id: user.id,
    userId: user.id,
    name: resolvedName,
    email: resolvedEmail,
    location: resolvedLocation,
    bio: resolvedBio || base.bio || "",
    phone: cvPersonal.phone?.trim() || base.phone,
    linkedin: cvPersonal.linkedin?.trim() || base.linkedin,
    github: cvPersonal.github?.trim() || base.github,
    portfolio: cvPersonal.portfolio?.trim() || base.portfolio,
    experienceYears,
    expectedSalary: base.expectedSalary ?? 0,
    readinessScore: base.readinessScore ?? 0,
    preferredJobTypes: prefs.preferredJobTypes,
    preferredWorkModes: prefs.preferredWorkModes,
    skills: skills.length > 0 ? skills : (base.skills ?? []),
    education: education.length > 0 ? education : base.education,
    experience: experience.length > 0 ? experience : base.experience,
    organizations:
      organizations.length > 0 ? organizations : base.organizations,
    projects: projects.length > 0 ? projects : base.projects,
    achievements: achievements.length > 0 ? achievements : base.achievements,
    cv: cv
      ? {
          filename: cv.filename,
          sizeBytes: cv.sizeBytes,
          uploadedAt: new Date().toISOString(),
          blobName: cv.blobName,
          contentType: cv.contentType,
          languageInsights: cv.languageInsights,
        }
      : base.cv,
    visibility: base.visibility ?? "applied-only",
  }));

  try {
    await recomputeReadinessScoreAsync(user.id);
  } catch (err) {
    console.error("[onboarding] readiness recompute failed (non-fatal):", err);
  }

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
  if (cv) {
    scheduleLearningPrewarmForProfile(updatedProfile);
  }
}

// ----- Practice learning -----

type SubmitPracticeAttemptInput = {
  slug: string;
  answer: string;
  evidenceFile?: File | null;
  mcAnswers?: { questionId: string; selectedIndex: number }[];
  target?: string;
};

function parsePracticeMcAnswers(
  value: FormDataEntryValue | null,
): SubmitPracticeAttemptInput["mcAnswers"] {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Record<string, unknown>;
        return {
          questionId: String(item.questionId ?? ""),
          selectedIndex: Number(item.selectedIndex),
        };
      })
      .filter(
        (
          entry,
        ): entry is { questionId: string; selectedIndex: number } =>
          entry !== null &&
          Boolean(entry.questionId) &&
          Number.isFinite(entry.selectedIndex),
      );
  } catch {
    return undefined;
  }
}

function normalizePracticeAttemptInput(
  input: SubmitPracticeAttemptInput | FormData,
): SubmitPracticeAttemptInput {
  if (!(input instanceof FormData)) return input;
  const evidence = input.get("evidenceFile");
  const target = asString(input.get("target"));
  return {
    slug: asString(input.get("slug")),
    answer: asString(input.get("answer")),
    target: target || undefined,
    evidenceFile: evidence instanceof File ? evidence : undefined,
    mcAnswers: parsePracticeMcAnswers(input.get("mcAnswers")),
  };
}

export async function submitPracticeAttempt(
  rawInput: SubmitPracticeAttemptInput | FormData,
): Promise<
  | {
      ok: true;
      score: number;
      attemptId: string;
      passed: boolean;
      level: string;
      completedAt: string;
      readinessScore: number;
      previousReadinessScore: number;
      readinessScoreIncrease: number;
      feedback: string;
      perCriterion: {
        id: string;
        name: string;
        score: number;
        feedback: string;
      }[];
      gradedBy: "ai" | "keyword";
      mcCorrect?: number;
      mcTotal?: number;
      evidenceFile?: PracticeEvidenceFile;
    }
  | { ok: false; error: string }
> {
  const input = normalizePracticeAttemptInput(rawInput);
  const user = await requireUser();
  const answer = input.answer.trim();
  if (!answer) return { ok: false, error: "Jawaban tidak boleh kosong." };

  const targetJob = input.target ? await getJobByIdAsync(input.target) : null;
  const jobContext = targetJob
    ? {
        jobId: targetJob.id,
        jobTitle: targetJob.title,
        jobCompany: targetJob.company,
      }
    : undefined;

  const task = await getPracticeTaskBySlugAsync(input.slug, jobContext);
  if (!task) return { ok: false, error: "Latihan tidak ditemukan." };
  const submission = resolvePracticeSubmission(task);

  let answerForGrading = answer;
  let evidenceFile: PracticeEvidenceFile | undefined;
  if (isExcelPracticeSubmission(submission)) {
    const file = input.evidenceFile;
    if (!(file instanceof File)) {
      return {
        ok: false,
        error: "Upload file spreadsheet (.xlsx) dulu sebelum mengirim jawaban.",
      };
    }
    const maxBytes = submission.maxFileSizeBytes ?? EXCEL_PRACTICE_MAX_BYTES;
    if (file.size === 0) {
      return {
        ok: false,
        error: "File spreadsheet kosong, coba upload ulang.",
      };
    }
    if (file.size > maxBytes) {
      return {
        ok: false,
        error: `File lebih besar dari ${formatPracticeFileSize(maxBytes)}. Ringkas workbook atau upload file yang lebih kecil.`,
      };
    }
    if (!file.name.match(/\.xlsx$/i)) {
      return {
        ok: false,
        error:
          "Format belum didukung. Upload file spreadsheet dengan ekstensi .xlsx.",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!looksLikeXlsx(buffer)) {
      return {
        ok: false,
        error:
          "File tidak terbaca sebagai workbook .xlsx. Pastikan file dibuat dari aplikasi spreadsheet dan bukan hasil rename.",
      };
    }

    let parsedEvidence;
    try {
      parsedEvidence = await parseExcelPracticeWorkbook({
        buffer,
        filename: file.name,
        task,
      });
    } catch (err) {
      console.error("[practice] Excel parse failed:", err);
      return {
        ok: false,
        error:
          "File spreadsheet gagal dibaca. Coba simpan ulang sebagai .xlsx lalu upload lagi.",
      };
    }

    let blobName: string | undefined;
    const contentType = file.type || EXCEL_PRACTICE_CONTENT_TYPE;
    if (isBlobConfigured()) {
      try {
        const uploaded = await uploadPracticeEvidence(
          buffer,
          file.name,
          user.id,
          contentType,
        );
        blobName = uploaded.blobName;
      } catch (err) {
        console.warn(
          "[practice] evidence upload failed, continuing with parsed workbook:",
          err,
        );
      }
    }

    evidenceFile = {
      kind: "excel",
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      sizeBytes: file.size,
      contentType,
      blobName,
    };
    answerForGrading = `${answer}\n\n${buildExcelPracticeEvidenceText(parsedEvidence)}`;
  }

  const requirementName = targetJob?.requirements.find(
    (r) => r.skillId === task.skillId,
  )?.name;
  const resolvedSkillName = requirementName ?? skillDisplayName(task.skillId);

  let score: number;
  let overallFeedback = "";
  let perCriterion: {
    id: string;
    name: string;
    score: number;
    feedback: string;
  }[] = [];
  let gradedBy: "ai" | "keyword" = "ai";

  try {
    const aiResult = await gradePracticeAnswerWithAi(task, answerForGrading);
    score = aiResult.totalScore;
    overallFeedback = aiResult.overallFeedback;
    perCriterion = aiResult.perCriterion.map((r) => ({
      id: r.criterion.id,
      name: r.criterion.name,
      score: r.score,
      feedback: r.feedback,
    }));
  } catch (err) {
    console.warn("[practice] AI grading failed, fallback to keyword:", err);
    gradedBy = "keyword";
    const results = gradePracticeAnswer(task, answerForGrading);
    score = calculatePracticeScore(results);
    perCriterion = results.map((r) => ({
      id: r.criterion.id,
      name: r.criterion.name,
      score: r.score,
      feedback:
        r.hits === 0
          ? `Belum terlihat sinyal kunci untuk ${r.criterion.name}.`
          : `Terlihat ${r.hits} sinyal untuk ${r.criterion.name}.`,
    }));
    overallFeedback =
      "Penilaian AI tidak tersedia, jadi skor pakai metode dasar berbasis kata kunci.";
  }

  let mcCorrect: number | undefined;
  let mcTotal: number | undefined;
  if (input.mcAnswers && input.mcAnswers.length > 0) {
    if (input.mcAnswers.some((a) => a.selectedIndex < 0)) {
      return {
        ok: false,
        error: "Jawab semua soal pilihan ganda dulu sebelum mengirim.",
      };
    }
    let set;
    try {
      const { getCheckpointSet } =
        await import("../learning/checkpoint-generator");
      set = await getCheckpointSet(task.skillId, {
        skillName: resolvedSkillName,
        jobContext: targetJob ?? undefined,
      });
    } catch (err) {
      console.error(
        "[practice] checkpoint fetch failed during grading:",
        String(err).slice(0, 120),
      );
      return {
        ok: false,
        error:
          "Soal pemahaman belum bisa dinilai sekarang. Coba kirim lagi sebentar lagi.",
      };
    }

    const warmup = set.questions.slice(0, input.mcAnswers.length);
    const byId = new Map(warmup.map((q) => [q.id, q]));
    const stale = input.mcAnswers.some((a) => !byId.has(a.questionId));
    if (stale) {
      return {
        ok: false,
        error:
          "Soal pemahaman sudah diperbarui sejak kamu membukanya. Muat ulang halaman lalu kerjakan lagi.",
      };
    }
    let correct = 0;
    for (const a of input.mcAnswers) {
      const q = byId.get(a.questionId);
      if (q && a.selectedIndex === q.correctIndex) correct++;
    }
    mcCorrect = correct;
    mcTotal = warmup.length;
    const mcScore = warmup.length > 0 ? (correct / warmup.length) * 100 : 0;
    score = Math.round(score * 0.5 + mcScore * 0.5);
  }

  const attempt = await recordPracticeAttempt({
    userId: user.id,
    taskId: task.id,
    taskSlug: task.slug,
    taskTitle: task.title,
    skillId: task.skillId,
    skillName: resolvedSkillName,
    score,
    answer,
    evidenceFile,
    feedback: overallFeedback,
    gradedBy,
    perCriterion,
    mcCorrect,
    mcTotal,
  });

  const readinessScoreChange = await recomputeReadinessScoreAsync(user.id);
  revalidateProfileSurfaces(user.id, { embedding: true });
  revalidatePath("/app/belajar");
  revalidatePath("/app/belajar/[slug]", "page");

  return {
    ok: true,
    score,
    attemptId: attempt.id,
    passed: attempt.passed,
    level: levelFromPracticeScore(score),
    completedAt: attempt.completedAt,
    readinessScore: readinessScoreChange.newScore,
    previousReadinessScore: readinessScoreChange.previousScore,
    readinessScoreIncrease: readinessScoreChange.increasedBy,
    feedback: overallFeedback,
    perCriterion,
    gradedBy,
    mcCorrect,
    mcTotal,
    evidenceFile,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  newEducationId,
  newExperienceId,
  setCv,
  setEducationList,
  setExperienceList,
  setVisibility,
  updateProfileBasic,
} from "./profile-store";
import type { Education, Experience } from "./types";

function revalidateProfileSurfaces() {
  revalidatePath("/app/profil");
  revalidatePath("/app");
  revalidatePath("/app/lowongan");
  revalidatePath("/app/lowongan/[id]", "page");
  revalidatePath("/app/lamaran");
  revalidatePath("/app/lamaran/[id]", "page");
}

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function asInt(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export async function saveProfile(
  _prev: SaveProfileResult | null,
  formData: FormData,
): Promise<SaveProfileResult> {
  const errors: Record<string, string> = {};
  const name = asString(formData.get("name"));
  const location = asString(formData.get("location"));
  const bio = asString(formData.get("bio"));
  const experienceYears = asInt(formData.get("experienceYears"), -1);
  const expectedSalary = asInt(formData.get("expectedSalary"), -1);
  const email = asString(formData.get("email"));

  if (!name) errors.name = "Nama tidak boleh kosong.";
  if (!location) errors.location = "Lokasi tidak boleh kosong.";
  if (!bio || bio.length < 10) errors.bio = "Bio terlalu pendek, tulis 1 sampai 2 kalimat.";
  if (bio.length > 280) errors.bio = "Bio terlalu panjang, batasi 280 karakter.";
  if (experienceYears < 0 || experienceYears > 60) errors.experienceYears = "Isi 0 sampai 60 tahun.";
  if (expectedSalary < 0) errors.expectedSalary = "Ekspektasi gaji tidak boleh negatif.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email tidak valid.";

  // Education
  const eduIds = formData.getAll("eduId").map((x) => String(x));
  const eduInsts = formData.getAll("eduInstitution").map((x) => String(x));
  const eduDegrees = formData.getAll("eduDegree").map((x) => String(x));
  const eduStarts = formData.getAll("eduStart").map((x) => String(x));
  const eduEnds = formData.getAll("eduEnd").map((x) => String(x));
  const eduNotes = formData.getAll("eduNotes").map((x) => String(x));
  const educationList: Education[] = [];
  for (let i = 0; i < eduIds.length; i++) {
    const institution = eduInsts[i]?.trim() ?? "";
    const degree = eduDegrees[i]?.trim() ?? "";
    if (!institution && !degree) continue; // skip empty rows
    if (!institution || !degree) {
      errors[`edu-${i}`] = "Institusi dan gelar wajib diisi.";
      continue;
    }
    educationList.push({
      id: eduIds[i] || newEducationId(),
      institution,
      degree,
      startMonth: eduStarts[i] || "",
      endMonth: eduEnds[i] || "",
      notes: eduNotes[i]?.trim() || undefined,
    });
  }

  // Experience
  const expIds = formData.getAll("expId").map((x) => String(x));
  const expPositions = formData.getAll("expPosition").map((x) => String(x));
  const expCompanies = formData.getAll("expCompany").map((x) => String(x));
  const expStarts = formData.getAll("expStart").map((x) => String(x));
  const expEnds = formData.getAll("expEnd").map((x) => String(x));
  const expDuties = formData.getAll("expDuties").map((x) => String(x));
  const experienceList: Experience[] = [];
  for (let i = 0; i < expIds.length; i++) {
    const position = expPositions[i]?.trim() ?? "";
    const company = expCompanies[i]?.trim() ?? "";
    if (!position && !company) continue;
    if (!position || !company) {
      errors[`exp-${i}`] = "Posisi dan perusahaan wajib diisi.";
      continue;
    }
    experienceList.push({
      id: expIds[i] || newExperienceId(),
      position,
      company,
      startMonth: expStarts[i] || "",
      endMonth: expEnds[i] || "",
      duties: expDuties[i]?.trim() || undefined,
    });
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  updateProfileBasic({ name, location, bio, experienceYears, expectedSalary, email });
  setEducationList(educationList);
  setExperienceList(experienceList);
  revalidateProfileSurfaces();
  redirect("/app/profil?saved=1");
}

// CV upload: stub mode. Stores filename + timestamp.
// When Azure Blob is wired (Fase 1), replace with real upload.
export type ParsedCvPreview = {
  filename: string;
  sizeBytes: number;
  skillsFound: string[];
  educationFound: number;
  experienceFound: number;
  notes: string[];
};

export async function uploadCvForReview(formData: FormData): Promise<ParsedCvPreview | { error: string }> {
  const file = formData.get("cv");
  if (!(file instanceof File)) {
    return { error: "Tidak ada file yang diupload." };
  }
  if (file.size === 0) {
    return { error: "File kosong, coba upload ulang." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File lebih besar dari 5 MB. Kompres dulu atau pilih format lain." };
  }
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx?|doc)$/i)) {
    return { error: "Format tidak didukung. Pakai PDF, DOC, atau DOCX." };
  }

  // Simulate parsing latency. Realistic for demo.
  await new Promise((r) => setTimeout(r, 1400));

  // Stub extraction. In Fase 2 this will call Azure OpenAI with the parsed text.
  return {
    filename: file.name,
    sizeBytes: file.size,
    skillsFound: [
      "Microsoft Excel",
      "Inventory Management",
      "Komunikasi",
      "Ketelitian",
      "Customer Service",
    ],
    educationFound: 1,
    experienceFound: 2,
    notes: [
      "Kami menemukan 5 skill, sebagian besar sudah ada di profilmu, 1 di antaranya baru.",
      "Riwayat pendidikan dan pengalaman terdeteksi.",
    ],
  };
}

export async function confirmCvUpdate(filename: string, sizeBytes: number) {
  if (!filename) return;
  setCv({
    filename,
    sizeBytes,
    uploadedAt: new Date().toISOString(),
  });
  revalidateProfileSurfaces();
  redirect("/app/profil?cv=1");
}

export async function setProfileVisibility(formData: FormData) {
  const value = String(formData.get("visibility") ?? "");
  if (value !== "applied-only" && value !== "all-companies") return;
  setVisibility(value);
  revalidatePath("/app/pengaturan");
  revalidatePath("/app/profil");
}

export async function deleteCandidateAccount() {
  // Demo: log out and bring user back to landing page.
  // Production: hard delete from Cosmos + Blob, send confirmation email.
  redirect("/?account-deleted=1");
}

export async function deleteCompanyAccount() {
  redirect("/?account-deleted=1");
}

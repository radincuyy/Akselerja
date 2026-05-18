"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  closeJobAsync,
  createJobAsync,
  getJobByIdAsync,
  reopenJobAsync,
  updateJobAsync,
  type JobInput,
} from "./jobs-store";
import { indexJob } from "./search-store";
import type { Job, SkillRequirement } from "./types";

const TYPES: Job["type"][] = ["Full-time", "Part-time", "Kontrak", "Magang"];

export type SaveJobResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function asInt(v: FormDataEntryValue | null, fallback = -1): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function parseInput(formData: FormData): {
  input: JobInput | null;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const title = asString(formData.get("title"));
  const company = asString(formData.get("company"));
  const location = asString(formData.get("location"));
  const industry = asString(formData.get("industry"));
  const description = asString(formData.get("description"));
  const typeRaw = asString(formData.get("type"));
  const salaryMin = asInt(formData.get("salaryMin"));
  const salaryMax = asInt(formData.get("salaryMax"));

  if (!title) errors.title = "Judul lowongan tidak boleh kosong.";
  if (title.length > 80) errors.title = "Judul terlalu panjang, batasi 80 karakter.";
  if (!company) errors.company = "Nama perusahaan tidak boleh kosong.";
  if (!location) errors.location = "Lokasi tidak boleh kosong.";
  if (!industry) errors.industry = "Industri tidak boleh kosong.";
  if (!description || description.length < 30) {
    errors.description = "Deskripsi minimal 30 karakter, jelaskan tugas utama dan konteks tim.";
  }
  if (description.length > 2000) {
    errors.description = "Deskripsi terlalu panjang, batasi 2000 karakter.";
  }

  const type = TYPES.includes(typeRaw as Job["type"]) ? (typeRaw as Job["type"]) : null;
  if (!type) errors.type = "Pilih tipe pekerjaan.";

  if (salaryMin < 0) errors.salaryMin = "Gaji minimum tidak boleh negatif.";
  if (salaryMax < 0) errors.salaryMax = "Gaji maksimum tidak boleh negatif.";
  if (salaryMin > 0 && salaryMax > 0 && salaryMin > salaryMax) {
    errors.salaryMax = "Gaji maksimum tidak boleh lebih kecil dari minimum.";
  }

  const skillIds = formData.getAll("reqSkillId").map((x) => String(x));
  const skillLevels = formData.getAll("reqLevel").map((x) => String(x));
  const skillWeights = formData.getAll("reqWeight").map((x) => String(x));

  const requirements: SkillRequirement[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < skillIds.length; i++) {
    const skillId = skillIds[i]?.trim() ?? "";
    if (!skillId) continue;
    if (seen.has(skillId)) {
      errors.requirements = "Skill tidak boleh duplikat.";
      continue;
    }
    seen.add(skillId);
    const lvl = Number(skillLevels[i]);
    const required = lvl === 1 || lvl === 2 || lvl === 3 ? (lvl as 1 | 2 | 3) : 2;
    const w = Number(skillWeights[i]);
    const weight = Number.isFinite(w) && w > 0 ? Math.min(1, Math.max(0.05, w)) : undefined;
    requirements.push({ skillId, required, weight });
  }

  if (requirements.length === 0) {
    errors.requirements = "Tambahkan minimal 1 skill yang dibutuhkan.";
  }
  if (requirements.length > 8) {
    errors.requirements = "Maksimal 8 skill, fokus pada yang paling penting.";
  }

  if (Object.keys(errors).length > 0 || !type) {
    return { input: null, errors };
  }

  return {
    input: {
      title,
      company,
      location,
      salaryMin: salaryMin || 0,
      salaryMax: salaryMax || 0,
      type,
      industry,
      description,
      requirements,
    },
    errors: {},
  };
}

function revalidateJobSurfaces() {
  revalidatePath("/hr");
  revalidatePath("/hr/lowongan");
  revalidatePath("/hr/lowongan/[id]", "page");
  revalidatePath("/app/lowongan");
  revalidatePath("/app/lowongan/[id]", "page");
}

export async function createJobAction(
  _prev: SaveJobResult | null,
  formData: FormData,
): Promise<SaveJobResult> {
  const { input, errors } = parseInput(formData);
  if (!input) return { ok: false, errors };
  const job = await createJobAsync(input);
  await indexJob(job);
  revalidateJobSurfaces();
  redirect(`/hr/lowongan/${job.id}`);
}

export async function updateJobAction(
  jobId: string,
  _prev: SaveJobResult | null,
  formData: FormData,
): Promise<SaveJobResult> {
  if (!jobId) return { ok: false, errors: { _form: "ID lowongan tidak ditemukan." } };
  if (!(await getJobByIdAsync(jobId))) {
    return { ok: false, errors: { _form: "Lowongan tidak ditemukan." } };
  }
  const { input, errors } = parseInput(formData);
  if (!input) return { ok: false, errors };
  const updated = await updateJobAsync(jobId, input);
  if (updated) await indexJob(updated);
  revalidateJobSurfaces();
  redirect(`/hr/lowongan/${jobId}?saved=1`);
}

export async function closeJobAction(jobId: string) {
  if (!jobId) return;
  const closed = await closeJobAsync(jobId);
  if (closed) await indexJob(closed);
  revalidateJobSurfaces();
}

export async function reopenJobAction(jobId: string) {
  if (!jobId) return;
  const reopened = await reopenJobAsync(jobId);
  if (reopened) await indexJob(reopened);
  revalidateJobSurfaces();
}

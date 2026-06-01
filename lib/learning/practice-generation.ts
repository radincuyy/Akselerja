import { CONTAINERS, getContainer, isCosmosConfigured } from "../infra/db";
import { generateGeminiJson, isGeminiConfigured } from "../ai/gemini-json";
import {
  formatSkkniReferences,
  searchSkkniReferences,
  type SkkniReference,
} from "./skkni-search";
import { skillById } from "./skills";
import type { PracticeRubricCriterion, PracticeTask } from "../shared/types";

const CACHE_VERSION = "v4-job-aware";
const DEFAULT_CACHE_TTL_HOURS = 168;
const PRACTICE_TYPES = [
  "case-simulation",
  "roleplay",
  "document-review",
  "design-brief",
] as const satisfies readonly PracticeTask["type"][];
const DYNAMIC_PRACTICE_PREFIX = "latihan-praktik-";

export type PracticeJobContext = {
  jobId: string;
  jobTitle: string;
  jobCompany?: string;
};

type CachedPracticeTask = {
  id: string;
  key: string;
  task: PracticeTask;
  createdAt: string;
};

type GeneratedPracticeTask = {
  role?: unknown;
  title?: unknown;
  type?: unknown;
  estimatedMinutes?: unknown;
  scenario?: unknown;
  instructions?: unknown;
  expectedEvidence?: unknown;
  rubric?: unknown;
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function cacheTtlMs(): number {
  const hours =
    Number(env("GEMINI_PRACTICE_CACHE_TTL_HOURS")) ||
    Number(env("AZURE_OPENAI_PRACTICE_CACHE_TTL_HOURS"));
  const normalized =
    Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_CACHE_TTL_HOURS;
  return normalized * 60 * 60 * 1000;
}

function isEnabled(): boolean {
  return env("GEMINI_PRACTICE_ENABLED") !== "0";
}

function cacheKey(
  skillId: string,
  jobContext?: PracticeJobContext,
): string {
  const jobPart = jobContext?.jobId ? `job:${jobContext.jobId}` : "no-job";
  return `practice-generation:${CACHE_VERSION}:${skillId}:${jobPart}`;
}

async function readCachedTask(key: string): Promise<PracticeTask | null> {
  if (!isCosmosConfigured()) return null;
  try {
    const { resource } = await getContainer(CONTAINERS.aiCache)
      .item(key, key)
      .read<CachedPracticeTask>();
    if (!resource?.task) return null;
    const age = Date.now() - new Date(resource.createdAt).getTime();
    if (age > cacheTtlMs()) return null;
    return resource.task;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 404
    ) {
      return null;
    }
    return null;
  }
}

async function writeCachedTask(key: string, task: PracticeTask): Promise<void> {
  if (!isCosmosConfigured()) return;
  try {
    const doc: CachedPracticeTask = {
      id: key,
      key,
      task,
      createdAt: new Date().toISOString(),
    };
    await getContainer(CONTAINERS.aiCache).items.upsert(doc);
  } catch (err) {
    console.warn("[practice-generation] cache write failed:", err);
  }
}

function cleanString(value: unknown, fallback: string, limit: number): string {
  const text = String(value ?? "").trim();
  return (text || fallback).slice(0, limit);
}

function cleanStringArray(
  value: unknown,
  fallback: string[],
  limit: number,
): string[] {
  const source = Array.isArray(value) ? value : fallback;
  const out: string[] = [];
  for (const item of source) {
    const text = String(item ?? "").trim();
    if (!text) continue;
    out.push(text.slice(0, 220));
    if (out.length >= limit) break;
  }
  return out.length > 0 ? out : fallback.slice(0, limit);
}

function normalizeType(value: unknown): PracticeTask["type"] {
  const text = String(value ?? "");
  return PRACTICE_TYPES.includes(text as PracticeTask["type"])
    ? (text as PracticeTask["type"])
    : "case-simulation";
}

function clampMinutes(value: unknown): number {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return 10;
  return Math.max(6, Math.min(25, Math.round(minutes)));
}

function defaultRubric(skillName: string): PracticeRubricCriterion[] {
  return [
    {
      id: "context",
      name: "Konteks kasus",
      description: `Jawaban menjelaskan situasi kerja yang relevan dengan ${skillName}.`,
      weight: 25,
      signals: [skillName, "kasus", "situasi", "masalah"],
    },
    {
      id: "workflow",
      name: "Langkah kerja",
      description: "Jawaban punya alur tindakan yang runtut dan bisa diikuti.",
      weight: 35,
      signals: ["langkah", "proses", "cek", "prioritas"],
    },
    {
      id: "reasoning",
      name: "Alasan keputusan",
      description: "Jawaban menunjukkan alasan di balik tindakan yang dipilih.",
      weight: 20,
      signals: ["karena", "alasan", "risiko", "kendala"],
    },
    {
      id: "outcome",
      name: "Hasil dan validasi",
      description: "Jawaban menyebut hasil, ukuran sukses, atau cara verifikasi.",
      weight: 20,
      signals: ["hasil", "validasi", "ukur", "laporan"],
    },
  ];
}

function normalizeRubric(
  value: unknown,
  skillName: string,
): PracticeRubricCriterion[] {
  if (!Array.isArray(value)) return defaultRubric(skillName);
  const defaults = defaultRubric(skillName);
  const raw = value.slice(0, 4);
  const weights = raw.length === 3 ? [35, 35, 30] : [25, 35, 20, 20];
  const rubric = raw.map((item, index) => {
    const entry = item as Record<string, unknown>;
    const fallback = defaults[index] ?? defaults[defaults.length - 1];
    const signals = cleanStringArray(entry.signals, fallback.signals, 6);
    return {
      id:
        cleanString(entry.id, fallback.id, 40)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || fallback.id,
      name: cleanString(entry.name, fallback.name, 80),
      description: cleanString(entry.description, fallback.description, 180),
      weight: weights[index] ?? Math.round(100 / raw.length),
      signals,
    };
  });
  return rubric.length >= 3 ? rubric : defaults;
}

function withDynamicPracticeIdentity(
  task: PracticeTask,
  skillId: string,
): PracticeTask {
  const slug = `${DYNAMIC_PRACTICE_PREFIX}${skillId}`;
  return {
    ...task,
    id: slug,
    slug,
  };
}

function normalizeGeneratedTask(
  raw: GeneratedPracticeTask,
  skillId: string,
  skillName: string,
  references: SkkniReference[],
  jobContext?: PracticeJobContext,
): PracticeTask {
  const slug = `${DYNAMIC_PRACTICE_PREFIX}${skillId}`;
  const referenceNotes = references.slice(0, 3).map((ref) => {
    const kuk = [ref.kukNumber, ref.kukText].filter(Boolean).join(" ");
    return `${ref.unitTitle}${kuk ? `, KUK ${kuk}` : ""}`;
  });
  return {
    id: slug,
    slug,
    role: jobContext?.jobTitle
      ? jobContext.jobTitle
      : cleanString(raw.role, "Latihan mandiri", 80),
    title: cleanString(raw.title, `Latihan praktik ${skillName}`, 120),
    skillId,
    type: normalizeType(raw.type),
    estimatedMinutes: clampMinutes(raw.estimatedMinutes),
    sourceLabel: references.length > 0 ? "Referensi SKKNI" : "Akselerja Skill Drill",
    sourceNotes:
      references.length > 0
        ? referenceNotes
        : [
            "Latihan ini dibuat otomatis untuk skill yang sedang kamu kejar.",
            "Cache dipakai agar latihan tidak dibuat ulang setiap halaman dibuka.",
          ],
    scenario: cleanString(
      raw.scenario,
      `Kamu diminta membuktikan kemampuan ${skillName} lewat kasus kerja singkat.`,
      900,
    ),
    instructions: cleanStringArray(
      raw.instructions,
      [
        `Jelaskan satu kasus kerja yang membutuhkan ${skillName}.`,
        "Tuliskan langkah yang kamu ambil dari awal sampai akhir.",
        "Tutup dengan hasil yang diharapkan dan cara mengecek kualitas pekerjaanmu.",
      ],
      5,
    ),
    expectedEvidence: cleanStringArray(
      raw.expectedEvidence,
      [
        `Ada contoh kasus konkret terkait ${skillName}.`,
        "Ada urutan langkah kerja yang jelas.",
        "Ada ukuran hasil atau cara validasi pekerjaan.",
      ],
      5,
    ),
    rubric: normalizeRubric(raw.rubric, skillName),
  };
}

async function generateTask(
  skillId: string,
  references: SkkniReference[],
  jobContext?: PracticeJobContext,
): Promise<PracticeTask | null> {
  const skillName = skillById[skillId]?.name ?? skillId;
  const jobAnchor = jobContext?.jobTitle
    ? `\nKonteks lowongan target: posisi "${jobContext.jobTitle}"${jobContext.jobCompany ? ` di ${jobContext.jobCompany}` : ""}. Skenario, instruksi, dan rubrik HARUS relevan dengan cara skill "${skillName}" dipakai pada pekerjaan "${jobContext.jobTitle}", bukan profesi lain. Contoh: untuk Fullstack developer, skill "Menggunakan AI" berarti memakai AI coding assistant atau mengintegrasikan API AI ke aplikasi, bukan analisis data penjualan.\n`
    : "";
  const raw = await generateGeminiJson<GeneratedPracticeTask>({
    systemInstruction:
      "Kamu membuat latihan skill untuk pencari kerja Indonesia. Output harus JSON valid saja. Jangan sebut vendor AI atau cloud. Bahasa Indonesia jelas dan konkret.",
    prompt: `Buat satu latihan praktik untuk skill "${skillName}".
${jobAnchor}
Gunakan referensi SKKNI berikut sebagai landasan kompetensi. Jika referensi tersedia, skenario, instruksi, expectedEvidence, dan rubrik harus menilai perilaku kerja yang selaras dengan unit, elemen, dan KUK.

REFERENSI SKKNI:
${formatSkkniReferences(references)}

JSON schema:
{
  "role": "Latihan mandiri atau role kerja yang relevan",
  "title": "judul pendek",
  "type": "case-simulation | roleplay | document-review | design-brief",
  "estimatedMinutes": 8-18,
  "scenario": "skenario kerja realistis, 2-4 kalimat",
  "instructions": ["3-5 instruksi aksi"],
  "expectedEvidence": ["3-5 bukti yang harus muncul di jawaban"],
  "rubric": [
    {
      "id": "huruf-kecil-tanpa-spasi",
      "name": "nama kriteria",
      "description": "deskripsi kriteria",
      "signals": ["kata atau frasa yang mungkin muncul di jawaban"]
    }
  ]
}

Rubrik harus 3-4 kriteria dan cocok untuk menilai jawaban teks pendek. Buat kasus realistis untuk pekerjaan entry-level atau fresh graduate.`,
    responseSchema: {
      type: "object",
      properties: {
        role: { type: "string" },
        title: { type: "string" },
        type: { type: "string" },
        estimatedMinutes: { type: "number" },
        scenario: { type: "string" },
        instructions: { type: "array", items: { type: "string" } },
        expectedEvidence: { type: "array", items: { type: "string" } },
        rubric: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              signals: { type: "array", items: { type: "string" } },
            },
            required: ["id", "name", "description", "signals"],
          },
        },
      },
      required: [
        "role",
        "title",
        "type",
        "estimatedMinutes",
        "scenario",
        "instructions",
        "expectedEvidence",
        "rubric",
      ],
    },
    temperature: 0.5,
    maxOutputTokens: 1200,
  });

  return normalizeGeneratedTask(raw, skillId, skillName, references, jobContext);
}

export async function getGeneratedPracticeTask(
  skillId: string,
  jobContext?: PracticeJobContext,
  options?: { forceCacheOnly?: boolean },
): Promise<PracticeTask | null> {
  if (!isEnabled() || !isGeminiConfigured()) return null;

  const key = cacheKey(skillId, jobContext);
  const cached = await readCachedTask(key);
  if (cached) return withDynamicPracticeIdentity(cached, skillId);

  if (options?.forceCacheOnly) return null;

  const references = await searchSkkniReferences({
    skillId,
    query: skillById[skillId]?.name ?? skillId,
    top: 4,
  });

  try {
    const task = await generateTask(skillId, references, jobContext);
    if (task) await writeCachedTask(key, task);
    return task;
  } catch (err) {
    console.warn("[practice-generation] generation failed:", err);
    return null;
  }
}

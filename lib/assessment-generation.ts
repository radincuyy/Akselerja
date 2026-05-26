import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";
import { generateGeminiJson, isGeminiConfigured } from "./gemini-json";
import {
  formatSkkniReferences,
  searchSkkniReferences,
  type SkkniReference,
} from "./skkni-search";
import { skillById } from "./skills";
import type { Assessment, AssessmentQuestion } from "./types";

const CACHE_VERSION = "v1-skkni";
const DEFAULT_CACHE_TTL_HOURS = 168;
const DEFAULT_GENERATION_TIMEOUT_MS = 5000;

type CachedAssessmentQuestions = {
  id: string;
  key: string;
  questions: AssessmentQuestion[];
  createdAt: string;
};

type GeneratedQuestion = {
  prompt?: unknown;
  options?: unknown;
  correctOptionId?: unknown;
};

type GeneratedAssessment = {
  questions?: GeneratedQuestion[];
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function cacheTtlMs(): number {
  const hours = Number(env("GEMINI_ASSESSMENT_CACHE_TTL_HOURS"));
  const normalized =
    Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_CACHE_TTL_HOURS;
  return normalized * 60 * 60 * 1000;
}

function isEnabled(): boolean {
  return env("GEMINI_ASSESSMENT_ENABLED") !== "0";
}

function generationTimeoutMs(): number {
  const value = Number.parseInt(env("ASSESSMENT_GENERATION_TIMEOUT_MS"), 10);
  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_GENERATION_TIMEOUT_MS;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Assessment generation timeout after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function cacheKey(
  assessment: Assessment,
  references: SkkniReference[],
): string {
  const referenceIds = references.map((ref) => ref.id).join(",");
  return `assessment-generation:${CACHE_VERSION}:${assessment.slug}:${assessment.skillId}:${referenceIds || "no-skkni"}`;
}

async function readCache(key: string): Promise<AssessmentQuestion[] | null> {
  if (!isCosmosConfigured()) return null;
  try {
    const { resource } = await getContainer(CONTAINERS.aiCache)
      .item(key, key)
      .read<CachedAssessmentQuestions>();
    if (!resource?.questions) return null;
    const age = Date.now() - new Date(resource.createdAt).getTime();
    if (age > cacheTtlMs()) return null;
    return resource.questions;
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

async function writeCache(
  key: string,
  questions: AssessmentQuestion[],
): Promise<void> {
  if (!isCosmosConfigured()) return;
  try {
    const doc: CachedAssessmentQuestions = {
      id: key,
      key,
      questions,
      createdAt: new Date().toISOString(),
    };
    await getContainer(CONTAINERS.aiCache).items.upsert(doc);
  } catch (err) {
    console.warn("[assessment-generation] cache write failed:", err);
  }
}

function cleanString(value: unknown, fallback: string, limit: number): string {
  const text = String(value ?? "").trim();
  return (text || fallback).slice(0, limit);
}

function cleanOptions(value: unknown): { id: string; label: string }[] {
  const raw = Array.isArray(value) ? value.slice(0, 4) : [];
  const fallback = [
    "Langkah kerja sesuai prosedur",
    "Langkah kerja tanpa verifikasi",
    "Menunda pekerjaan tanpa alasan",
    "Mengabaikan instruksi kerja",
  ];
  const labels = raw.map((item, index) => {
    if (item && typeof item === "object" && "label" in item) {
      return cleanString(
        (item as { label?: unknown }).label,
        fallback[index] ?? `Pilihan ${index + 1}`,
        180,
      );
    }
    return cleanString(item, fallback[index] ?? `Pilihan ${index + 1}`, 180);
  });

  while (labels.length < 4) {
    labels.push(fallback[labels.length] ?? `Pilihan ${labels.length + 1}`);
  }

  return labels.slice(0, 4).map((label, index) => ({
    id: String.fromCharCode(97 + index),
    label,
  }));
}

function normalizeCorrectOptionId(value: unknown): string {
  const text = String(value ?? "").trim().toLowerCase();
  return ["a", "b", "c", "d"].includes(text) ? text : "a";
}

function normalizeQuestions(
  raw: GeneratedAssessment,
  assessment: Assessment,
): AssessmentQuestion[] {
  const source = Array.isArray(raw.questions) ? raw.questions : [];
  const total = Math.max(3, Math.min(8, assessment.questionCount || 5));

  return source.slice(0, total).map((question, index) => {
    const options = cleanOptions(question.options);
    return {
      id: `${assessment.slug}-ai-${index + 1}`,
      prompt: cleanString(
        question.prompt,
        `Apa langkah paling tepat untuk menerapkan ${skillById[assessment.skillId]?.name ?? assessment.skillId} dalam situasi kerja?`,
        500,
      ),
      options,
      correctOptionId: normalizeCorrectOptionId(question.correctOptionId),
    };
  });
}

function fallbackQuestions(assessment: Assessment): AssessmentQuestion[] {
  const skillName = skillById[assessment.skillId]?.name ?? assessment.skillId;
  return [
    {
      id: `${assessment.slug}-fallback-1`,
      prompt: `Dalam pekerjaan entry-level, apa langkah pertama yang paling tepat saat diminta menunjukkan kemampuan ${skillName}?`,
      options: [
        {
          id: "a",
          label:
            "Memahami tujuan pekerjaan, prosedur, dan hasil yang diharapkan sebelum mulai bekerja.",
        },
        {
          id: "b",
          label:
            "Langsung mengerjakan secepat mungkin tanpa mengecek kebutuhan.",
        },
        {
          id: "c",
          label:
            "Menunggu instruksi tambahan walaupun informasi utama sudah tersedia.",
        },
        {
          id: "d",
          label:
            "Menyalin cara kerja orang lain tanpa menyesuaikan konteks tugas.",
        },
      ],
      correctOptionId: "a",
    },
    {
      id: `${assessment.slug}-fallback-2`,
      prompt: `Apa bukti paling kuat bahwa kandidat benar-benar memahami ${skillName}?`,
      options: [
        {
          id: "a",
          label:
            "Kandidat bisa menjelaskan langkah kerja, alasan keputusan, dan cara mengecek hasil.",
        },
        {
          id: "b",
          label:
            "Kandidat menyebut nama skill tersebut berkali-kali di CV.",
        },
        {
          id: "c",
          label:
            "Kandidat menghindari pertanyaan teknis dan hanya menjawab secara umum.",
        },
        {
          id: "d",
          label:
            "Kandidat fokus pada kecepatan tanpa memperhatikan kualitas.",
        },
      ],
      correctOptionId: "a",
    },
    {
      id: `${assessment.slug}-fallback-3`,
      prompt: `Jika hasil pekerjaan terkait ${skillName} belum sesuai, respons kerja yang paling profesional adalah...`,
      options: [
        {
          id: "a",
          label:
            "Mengecek sumber masalah, memperbaiki sesuai prioritas, lalu meminta validasi bila perlu.",
        },
        {
          id: "b",
          label:
            "Menyalahkan brief dan langsung menyerahkan hasil apa adanya.",
        },
        {
          id: "c",
          label:
            "Menghapus bagian yang sulit agar tugas terlihat selesai.",
        },
        {
          id: "d",
          label:
            "Menunda perbaikan sampai ada orang lain yang mengingatkan.",
        },
      ],
      correctOptionId: "a",
    },
  ];
}

export async function getGeneratedAssessmentQuestions(
  assessment: Assessment,
): Promise<AssessmentQuestion[]> {
  if (!isEnabled() || !isGeminiConfigured()) return [];

  const skillName = skillById[assessment.skillId]?.name ?? assessment.skillId;
  const references = await searchSkkniReferences({
    skillId: assessment.skillId,
    query: `${skillName} ${assessment.title}`,
    top: 5,
  });
  const key = cacheKey(assessment, references);
  const cached = await readCache(key);
  if (cached) return cached;

  try {
    const raw = await withTimeout(
      generateGeminiJson<GeneratedAssessment>({
        systemInstruction:
          "Kamu membuat soal pilihan ganda untuk assessment skill pencari kerja Indonesia. Output harus JSON valid saja. Jangan sebut vendor AI atau cloud.",
        prompt: `Buat ${Math.max(3, Math.min(8, assessment.questionCount || 5))} soal pilihan ganda untuk assessment "${assessment.title}".

Skill: ${skillName}
Deskripsi assessment: ${assessment.description}

Gunakan referensi SKKNI berikut sebagai landasan. Soal harus menguji keputusan kerja, prosedur, verifikasi, atau respons kandidat yang sesuai dengan KUK. Jangan menyalin KUK mentah sebagai jawaban.

REFERENSI SKKNI:
${formatSkkniReferences(references)}

Aturan:
- Bahasa Indonesia.
- Setiap soal punya 4 opsi: a, b, c, d.
- Hanya satu jawaban benar.
- Opsi salah harus masuk akal, bukan bercanda.
- Hindari pertanyaan hafalan nomor SKKNI.
- Fokus pada situasi kerja nyata entry-level.

JSON schema:
{
  "questions": [
    {
      "prompt": "teks soal",
      "options": [
        { "id": "a", "label": "opsi A" },
        { "id": "b", "label": "opsi B" },
        { "id": "c", "label": "opsi C" },
        { "id": "d", "label": "opsi D" }
      ],
      "correctOptionId": "a"
    }
  ]
}`,
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prompt: { type: "string" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        label: { type: "string" },
                      },
                      required: ["id", "label"],
                    },
                  },
                  correctOptionId: { type: "string" },
                },
                required: ["prompt", "options", "correctOptionId"],
              },
            },
          },
          required: ["questions"],
        },
        temperature: 0.35,
        maxOutputTokens: 900,
      }),
      generationTimeoutMs(),
    );
    const questions = normalizeQuestions(raw, assessment);
    if (questions.length > 0) await writeCache(key, questions);
    return questions.length > 0 ? questions : fallbackQuestions(assessment);
  } catch (err) {
    console.warn("[assessment-generation] generation failed:", err);
    return fallbackQuestions(assessment);
  }
}

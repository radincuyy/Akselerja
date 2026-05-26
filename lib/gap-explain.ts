import { GoogleGenAI } from "@google/genai";
import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";
import { skillById } from "./skills";
import type { Job } from "./types";

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
const CACHE_TTL_HOURS = 24;

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tidak terkonfigurasi.");
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

type CachedExplanation = {
  id: string;
  key: string;
  text: string;
  createdAt: string;
};

function cacheKey(jobId: string, gapSkillId: string, candidateSkillIds: string[]): string {
  // Profile skills are part of the key so the explanation refreshes when the
  // user adds new skills (the contrast they bridge changes).
  const sorted = [...candidateSkillIds].sort().join(",");
  return `gap-explain:${jobId}:${gapSkillId}:${sorted}`;
}

async function readCache(key: string): Promise<string | null> {
  if (!isCosmosConfigured()) return null;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const { resource } = await container
      .item(key, key)
      .read<CachedExplanation>();
    if (!resource) return null;
    const ageMs = Date.now() - new Date(resource.createdAt).getTime();
    if (ageMs > CACHE_TTL_HOURS * 60 * 60 * 1000) return null;
    return resource.text;
  } catch {
    return null;
  }
}

async function writeCache(key: string, text: string): Promise<void> {
  if (!isCosmosConfigured()) return;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const doc: CachedExplanation = {
      id: key,
      key,
      text,
      createdAt: new Date().toISOString(),
    };
    await container.items.upsert(doc);
  } catch (err) {
    console.warn("[gap-explain] cache write failed:", err);
  }
}

const SYSTEM_INSTRUCTION = `Kamu adalah pendamping karier untuk pencari kerja Indonesia di platform Akselerja.

Tugasmu: jelaskan dalam 2-3 kalimat singkat kenapa skill tertentu penting untuk lowongan spesifik, dan beri satu langkah konkret pertama untuk menutupnya.

Aturan:
- Bahasa Indonesia ramah dan to the point. Tidak formal kaku.
- JANGAN pakai em dash atau en dash. Pakai koma, titik dua, atau hyphen biasa.
- JANGAN sebut Azure, Gemini, OpenAI, atau Google.
- JANGAN mengarang fakta perusahaan yang tidak ada di konteks.
- Hubungkan skill dengan tugas atau industri yang user lihat di lowongan, bukan definisi umum.
- Output: 2-3 kalimat. Tanpa heading, tanpa list, tanpa bullet.`;

export async function explainGap(input: {
  job: Job;
  gapSkillId: string;
  gapSkillName: string;
  candidateSkillIds: string[];
}): Promise<string> {
  const key = cacheKey(input.job.id, input.gapSkillId, input.candidateSkillIds);
  const cached = await readCache(key);
  if (cached) return cached;

  const haveSkillsText = input.candidateSkillIds.length
    ? input.candidateSkillIds
        .map((id) => skillById[id]?.name ?? id)
        .slice(0, 8)
        .join(", ")
    : "(belum ada skill di profil)";

  const prompt = `LOWONGAN TARGET:
- Posisi: ${input.job.title}
- Perusahaan: ${input.job.company}
- Industri: ${input.job.industry ?? "tidak diketahui"}
- Lokasi: ${input.job.location}
- Deskripsi singkat: ${(input.job.description ?? "").slice(0, 600)}

PROFIL USER:
- Skill yang sudah dimiliki: ${haveSkillsText}

SKILL YANG PERLU DITUTUP:
${input.gapSkillName}

Tulis 2-3 kalimat yang menjelaskan kenapa skill ini penting untuk perusahaan ini dan apa langkah konkret pertama yang harus user ambil. Hubungkan dengan skill yang sudah dimiliki user kalau relevan.`;

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.55,
        maxOutputTokens: 220,
      },
    });
    const text = response.text?.trim();
    if (!text) {
      return defaultExplanation(input.gapSkillName, input.job.company);
    }
    await writeCache(key, text);
    return text;
  } catch (err) {
    console.warn("[gap-explain] generation failed:", err);
    return defaultExplanation(input.gapSkillName, input.job.company);
  }
}

function defaultExplanation(skillName: string, company: string): string {
  // Static fallback if the model is unreachable. Keeps the page usable without
  // exposing the failure to the user.
  return `${skillName} disebut sebagai prioritas oleh ${company}, jadi menutupnya adalah langkah dengan dampak terbesar ke peluangmu di lowongan ini. Mulai dari materi paling dasar lalu lanjutkan ke kasus praktis sesuai industri perusahaan.`;
}

export async function readCachedGapExplanations(input: {
  job: Job;
  gaps: { skillId: string; name: string }[];
  candidateSkillIds: string[];
  limit?: number;
}): Promise<Map<string, string>> {
  const limit = input.limit ?? 4;
  const slice = input.gaps.slice(0, limit);
  const results = await Promise.all(
    slice.map(async (g) => {
      const cached = await readCache(
        cacheKey(input.job.id, g.skillId, input.candidateSkillIds),
      );
      return cached ? ([g.skillId, cached] as const) : null;
    }),
  );
  return new Map(results.filter((r): r is [string, string] => Boolean(r)));
}

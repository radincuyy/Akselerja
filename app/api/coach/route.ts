import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/auth";
import { getProfileAsync } from "@/lib/profile-store";
import { searchJobs } from "@/lib/search-store";
import { calcMatch } from "@/lib/match";
import { skillById } from "@/lib/skills";
import { findCoursesForGapsAsync } from "@/lib/courses-store";
import { listPracticeTasksAsync } from "@/lib/practice-store";
import type { Candidate, Course, Job, PracticeTask } from "@/lib/types";

export const runtime = "nodejs";

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
const MAX_HISTORY = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

type Role = "user" | "coach";
type ClientMessage = { role: Role; text: string };

// In-memory sliding window. Resets on cold start, which is fine for a demo
// app. For production back this with Cosmos or Redis.
const userBuckets = new Map<string, number[]>();

function checkRateLimit(userId: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = userBuckets.get(userId) ?? [];
  const fresh = bucket.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX) {
    const oldest = Math.min(...fresh);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000),
    );
    userBuckets.set(userId, fresh);
    return { ok: false, retryAfterSec };
  }
  fresh.push(now);
  userBuckets.set(userId, fresh);
  return { ok: true };
}

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

function summarizeProfile(profile: Candidate): string {
  const lines: string[] = [];
  if (profile.name) lines.push(`Nama: ${profile.name}`);
  if (profile.location) lines.push(`Lokasi: ${profile.location}`);
  if (profile.experienceYears != null) {
    lines.push(`Pengalaman total: ${profile.experienceYears} tahun`);
  }
  if (profile.expectedSalary && profile.expectedSalary > 0) {
    lines.push(
      `Ekspektasi gaji: Rp ${profile.expectedSalary.toLocaleString("id-ID")}`,
    );
  }
  if (profile.preferredJobTypes && profile.preferredJobTypes.length > 0) {
    lines.push(`Tipe kerja diminati: ${profile.preferredJobTypes.join(", ")}`);
  }
  if (profile.industries && profile.industries.length > 0) {
    lines.push(`Industri diminati: ${profile.industries.join(", ")}`);
  }
  const skills = (profile.skills ?? [])
    .map((s) => s.name ?? skillById[s.skillId]?.name ?? s.skillId)
    .filter(Boolean);
  if (skills.length > 0) {
    lines.push(`Skill di profil: ${skills.join(", ")}`);
  }
  if (profile.bio?.trim()) {
    lines.push(`Bio: ${profile.bio.trim()}`);
  }
  return lines.join("\n") || "Profil masih kosong.";
}

function summarizeMatch(profile: Candidate, job: Job, score: number): string {
  const { breakdown } = calcMatch(profile, job);
  const matched = breakdown
    .filter((b) => b.state === "match")
    .slice(0, 4)
    .map((b) => b.name);
  const missing = breakdown
    .filter((b) => b.state === "missing")
    .slice(0, 4)
    .map((b) => b.name);
  const lines = [
    `- ${job.title} di ${job.company} (${job.location}) — match score ${score}%`,
  ];
  if (matched.length) lines.push(`  cocok: ${matched.join(", ")}`);
  if (missing.length) lines.push(`  gap: ${missing.join(", ")}`);
  return lines.join("\n");
}

const SYSTEM_INSTRUCTION = `Kamu adalah pendamping karier untuk pengguna aplikasi Akselerja, sebuah platform job matching dan upskilling untuk pencari kerja Indonesia (fresh graduate, korban PHK, transisi karier).

Aturan penting:
- Bahasa Indonesia yang ramah, jelas, ringkas. Jangan formal kaku, jangan bahasa gaul berlebihan.
- Hindari em dash (—) dan en dash (–) di jawaban kamu. Pakai koma, titik dua, atau tanda hubung biasa.
- JANGAN sebut nama vendor seperti Azure, Gemini, OpenAI, atau Google AI di jawaban.
- JANGAN mengarang skor, lowongan, perusahaan, atau angka gaji yang tidak ada di konteks. Kalau tidak ada datanya, bilang jujur.
- Setiap saran konkret harus terhubung ke profil atau lowongan yang ada di konteks user.
- Jawaban maksimal 4 paragraf pendek. Pakai bullet maksimal 4 poin kalau perlu.
- Tutup dengan satu pertanyaan lanjutan kalau cocok, agar percakapan terus jalan.

Kalau user nanya soal skor, skill gap, lowongan, atau langkah belajar, gunakan data konteks di bawah ini.`;

function buildContext(
  profile: Candidate,
  ranked: { job: Job; score: number }[],
  courses: Course[],
  practices: PracticeTask[],
) {
  const profileBlock = summarizeProfile(profile);
  const top = ranked.slice(0, 3);
  const matchBlock =
    top.length === 0
      ? "Belum ada lowongan yang ke-rank untuk profil ini."
      : top.map((r) => summarizeMatch(profile, r.job, r.score)).join("\n");
  const coursesBlock =
    courses.length === 0
      ? "Tidak ada kursus terkurasi yang relevan."
      : courses
          .slice(0, 3)
          .map(
            (c) =>
              `- ${c.title} (${c.provider}, ${c.durationHours} jam${c.free ? ", gratis" : ""}) untuk skill ${skillById[c.skillId]?.name ?? c.skillId}`,
          )
          .join("\n");
  const practicesBlock =
    practices.length === 0
      ? "Tidak ada latihan praktik untuk skill prioritas user."
      : practices
          .slice(0, 3)
          .map(
            (p) =>
              `- ${p.title} (${p.estimatedMinutes} menit) untuk skill ${skillById[p.skillId]?.name ?? p.skillId}`,
          )
          .join("\n");
  return `PROFIL USER:\n${profileBlock}\n\nLOWONGAN PALING COCOK SAAT INI:\n${matchBlock}\n\nKURSUS RELEVAN UNTUK GAP USER:\n${coursesBlock}\n\nLATIHAN PRAKTIK UNTUK GAP USER:\n${practicesBlock}`;
}

function gatherGapSkillIds(
  profile: Candidate,
  ranked: { job: Job; score: number }[],
): string[] {
  const have = new Set(profile.skills.map((s) => s.skillId));
  const gaps = new Set<string>();
  for (const r of ranked.slice(0, 5)) {
    for (const req of r.job.requirements ?? []) {
      if (!have.has(req.skillId)) gaps.add(req.skillId);
    }
  }
  return [...gaps];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const limit = checkRateLimit(session.user.id);
  if (!limit.ok) {
    const minutes = Math.ceil(limit.retryAfterSec / 60);
    return NextResponse.json(
      {
        error: `Batas chat coach per jam tercapai. Coba lagi dalam ${minutes} menit.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const cleaned: ClientMessage[] = [];
  for (const m of messages) {
    if (
      m &&
      typeof m === "object" &&
      "role" in m &&
      "text" in m &&
      (m.role === "user" || m.role === "coach") &&
      typeof m.text === "string" &&
      m.text.trim().length > 0
    ) {
      cleaned.push({ role: m.role, text: m.text.trim().slice(0, 2000) });
    }
  }
  if (cleaned.length === 0) {
    return NextResponse.json({ error: "Tidak ada pesan." }, { status: 400 });
  }
  const lastUser = [...cleaned].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "Belum ada pesan user." }, { status: 400 });
  }

  const profile = await getProfileAsync(session.user.id);
  if (!profile) {
    return NextResponse.json(
      {
        error:
          "Profil belum lengkap. Selesaikan onboarding dulu supaya coach bisa membantu spesifik.",
      },
      { status: 400 },
    );
  }

  let ranked: { job: Job; score: number }[] = [];
  try {
    const search = await searchJobs({
      top: 10,
      profileVector: profile.profileVector,
      includeClosed: false,
    });
    ranked = search.jobs
      .map((job) => ({ job, score: calcMatch(profile, job).score }))
      .sort((a, b) => b.score - a.score);
  } catch (err) {
    console.error("[coach] match search failed:", err);
  }

  // Retrieve materials in parallel so the prompt has concrete next steps.
  // Both are non-fatal: if quota or Cosmos hiccups, we just skip the section.
  const gapSkillIds = gatherGapSkillIds(profile, ranked);
  const [courses, practices] = await Promise.all([
    gapSkillIds.length > 0
      ? findCoursesForGapsAsync(gapSkillIds, 3).catch((err) => {
          console.warn("[coach] course retrieval failed:", err);
          return [] as Course[];
        })
      : Promise.resolve([] as Course[]),
    listPracticeTasksAsync()
      .then((all) =>
        all.filter((p) => gapSkillIds.includes(p.skillId)).slice(0, 3),
      )
      .catch((err) => {
        console.warn("[coach] practice retrieval failed:", err);
        return [] as PracticeTask[];
      }),
  ]);

  const context = buildContext(profile, ranked, courses, practices);
  const trimmed = cleaned.slice(-MAX_HISTORY);
  const history = trimmed.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  const userTurn = trimmed[trimmed.length - 1];

  try {
    const ai = getClient();
    const stream = await ai.models.generateContentStream({
      model: CHAT_MODEL,
      contents: [
        ...history,
        {
          role: "user",
          parts: [
            {
              text: `${context}\n\n--- Pertanyaan user ---\n${userTurn.text}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        maxOutputTokens: 600,
      },
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        let any = false;
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (typeof text === "string" && text.length > 0) {
              controller.enqueue(encoder.encode(text));
              any = true;
            }
          }
          if (!any) {
            controller.enqueue(
              encoder.encode(
                "Coach belum bisa menjawab sekarang. Coba ulangi sebentar.",
              ),
            );
          }
        } catch (err) {
          console.error("[coach] stream failed:", err);
          controller.enqueue(
            encoder.encode(
              "\n\n[Koneksi coach terputus, coba kirim ulang pesanmu.]",
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[coach] generation failed:", err);
    const message = err instanceof Error ? err.message : "Coach error.";
    if (message.includes("quota") || message.includes("Quota")) {
      return NextResponse.json(
        {
          error:
            "Kuota harian coach sudah habis. Coba lagi besok atau hubungi admin.",
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Coach belum bisa menjawab sekarang. Coba lagi sebentar." },
      { status: 502 },
    );
  }
}

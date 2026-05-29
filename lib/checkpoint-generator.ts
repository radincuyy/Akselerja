import { generateGeminiJson, isGeminiConfigured } from "./gemini-json";
import { skillById } from "./skills";
import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";
import type { Job, Candidate } from "./types";

export type CheckpointQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type CheckpointSet = {
  skillId: string;
  skillName: string;
  questions: CheckpointQuestion[];
  generatedAt: string;
  generatedBy: "ai" | "fallback";
};

const CACHE_TTL_HOURS = 24;
const CACHE_VERSION = "v1";

function cacheKey(skillId: string): string {
  return `checkpoint:${CACHE_VERSION}:${skillId}`;
}

type CachedCheckpoint = {
  id: string;
  skillId: string;
  set: CheckpointSet;
  expiresAt: string;
};

async function readCache(skillId: string): Promise<CheckpointSet | null> {
  if (!isCosmosConfigured()) return null;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const id = cacheKey(skillId);
    const { resource } = await container.item(id, id).read<CachedCheckpoint>();
    if (!resource) return null;
    if (new Date(resource.expiresAt).getTime() < Date.now()) return null;
    return resource.set;
  } catch {
    return null;
  }
}

async function writeCache(set: CheckpointSet): Promise<void> {
  if (!isCosmosConfigured()) return;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const id = cacheKey(set.skillId);
    const expiresAt = new Date(
      Date.now() + CACHE_TTL_HOURS * 3600 * 1000,
    ).toISOString();
    await container.items.upsert<CachedCheckpoint>({
      id,
      skillId: set.skillId,
      set,
      expiresAt,
    });
  } catch (err) {
    console.warn(
      "[checkpoint-generator] cache write failed:",
      String(err).slice(0, 120),
    );
  }
}

function fallbackQuestions(skillName: string): CheckpointQuestion[] {
  return [
    {
      id: "q1",
      prompt: `Apa langkah pertama saat kamu baru pertama kali menggunakan ${skillName} dalam konteks pekerjaan?`,
      options: [
        "Langsung mengerjakan tugas tanpa eksplorasi",
        "Membaca dokumentasi atau panduan dasar",
        "Menyalin pekerjaan rekan tanpa memahami",
        "Menunggu sampai diberi instruksi detail",
      ],
      correctIndex: 1,
      explanation:
        "Membaca panduan dasar membantumu memahami konsep dan menghindari kesalahan dasar.",
    },
    {
      id: "q2",
      prompt: `Saat menemui error atau masalah dengan ${skillName}, apa yang sebaiknya kamu lakukan lebih dahulu?`,
      options: [
        "Langsung bertanya ke senior",
        "Menyerah dan ganti tugas lain",
        "Mencari pesan error dan mendiagnosis penyebabnya",
        "Mengabaikan masalahnya",
      ],
      correctIndex: 2,
      explanation:
        "Mencari pesan error dan mendiagnosis adalah keterampilan dasar problem solving teknis.",
    },
    {
      id: "q3",
      prompt: `Bagaimana cara terbaik membuktikan bahwa kamu sudah menguasai ${skillName}?`,
      options: [
        "Mencantumkannya di CV tanpa contoh",
        "Mengerjakan proyek kecil dan mendokumentasikan hasilnya",
        "Mengikuti banyak kursus tanpa praktik",
        "Hanya membaca teori",
      ],
      correctIndex: 1,
      explanation:
        "Bukti konkret berupa proyek atau hasil kerja menunjukkan penguasaan, bukan sekadar klaim.",
    },
  ];
}

export async function getCheckpointSet(
  skillId: string,
  options: { jobContext?: Job; candidate?: Candidate } = {},
): Promise<CheckpointSet> {
  const cached = await readCache(skillId);
  if (cached) return cached;

  const skillName = skillById[skillId]?.name ?? skillId;

  if (!isGeminiConfigured()) {
    const set: CheckpointSet = {
      skillId,
      skillName,
      questions: fallbackQuestions(skillName),
      generatedAt: new Date().toISOString(),
      generatedBy: "fallback",
    };
    await writeCache(set);
    return set;
  }

  const jobHint = options.jobContext
    ? `Konteks lowongan target: ${options.jobContext.title} di ${options.jobContext.company}.`
    : "";

  type RawCheckpoint = {
    questions: {
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };

  try {
    const raw = await generateGeminiJson<RawCheckpoint>({
      systemInstruction:
        "Kamu adalah asisten pembuat soal pemahaman cepat untuk skill kerja. Jawab dalam JSON valid berbahasa Indonesia. Soal harus konseptual dan praktis, bukan trivia hafalan. Hindari soal yang ambigu.",
      prompt: `Buat 3 soal pilihan ganda untuk menguji pemahaman dasar skill "${skillName}".

${jobHint}

Aturan:
- Setiap soal punya 4 pilihan (A, B, C, D), tepat satu jawaban benar.
- Pertanyaan menguji pemahaman konsep atau pengambilan keputusan, bukan menghafal sintaks atau angka.
- Pakai bahasa Indonesia lugas, kalimat pendek.
- Tambahkan penjelasan singkat (1-2 kalimat) kenapa jawaban benar.
- Jangan sebut "kursus", "buka materi", atau "pelajari dulu" di pertanyaan; pertanyaan harus bisa berdiri sendiri.

Kembalikan JSON valid dengan struktur persis seperti ini:
{
  "questions": [
    {
      "prompt": "string pertanyaan",
      "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"],
      "correctIndex": 0,
      "explanation": "alasan singkat"
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
                  items: { type: "string" },
                },
                correctIndex: { type: "number" },
                explanation: { type: "string" },
              },
              required: ["prompt", "options", "correctIndex", "explanation"],
            },
          },
        },
        required: ["questions"],
      },
      maxOutputTokens: 1500,
    });

    const questions: CheckpointQuestion[] = (raw.questions ?? [])
      .slice(0, 3)
      .map((q, i) => ({
        id: `q${i + 1}`,
        prompt: String(q.prompt ?? "").trim(),
        options: Array.isArray(q.options)
          ? q.options.slice(0, 4).map((o) => String(o).trim())
          : [],
        correctIndex:
          typeof q.correctIndex === "number" &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3
            ? q.correctIndex
            : 0,
        explanation: String(q.explanation ?? "").trim(),
      }))
      .filter((q) => q.prompt && q.options.length === 4 && q.explanation);

    if (questions.length < 3) {
      throw new Error(`AI returned only ${questions.length} valid questions`);
    }

    const set: CheckpointSet = {
      skillId,
      skillName,
      questions,
      generatedAt: new Date().toISOString(),
      generatedBy: "ai",
    };
    await writeCache(set);
    return set;
  } catch (err) {
    console.warn(
      "[checkpoint-generator] AI failed, using fallback:",
      String(err).slice(0, 120),
    );
    const set: CheckpointSet = {
      skillId,
      skillName,
      questions: fallbackQuestions(skillName),
      generatedAt: new Date().toISOString(),
      generatedBy: "fallback",
    };
    await writeCache(set);
    return set;
  }
}

export type CheckpointGradeInput = {
  skillId: string;
  answers: { questionId: string; selectedIndex: number }[];
};

export type CheckpointGradeResult = {
  total: number;
  correct: number;
  passed: boolean;
  perQuestion: {
    questionId: string;
    correct: boolean;
    correctIndex: number;
    explanation: string;
  }[];
};

export const CHECKPOINT_PASS_THRESHOLD = 2;

export async function gradeCheckpoint(
  input: CheckpointGradeInput,
): Promise<CheckpointGradeResult | null> {
  const set = await readCache(input.skillId);
  if (!set) return null;

  const byId = new Map(set.questions.map((q) => [q.id, q]));
  let correctCount = 0;
  const perQuestion = input.answers.map((a) => {
    const q = byId.get(a.questionId);
    if (!q) {
      return {
        questionId: a.questionId,
        correct: false,
        correctIndex: 0,
        explanation: "",
      };
    }
    const isCorrect = a.selectedIndex === q.correctIndex;
    if (isCorrect) correctCount++;
    return {
      questionId: a.questionId,
      correct: isCorrect,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    };
  });

  return {
    total: set.questions.length,
    correct: correctCount,
    passed: correctCount >= CHECKPOINT_PASS_THRESHOLD,
    perQuestion,
  };
}

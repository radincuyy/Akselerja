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
const CACHE_VERSION = "v3";
const QUESTION_COUNT = 10;

function nameSlug(skillName: string): string {
  return skillName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function cacheKey(
  skillId: string,
  skillName: string,
  jobId?: string,
): string {
  const jobPart = jobId ? `job-${jobId}` : "no-job";
  return `checkpoint:${CACHE_VERSION}:${skillId}:${nameSlug(skillName)}:${jobPart}`;
}

type CachedCheckpoint = {
  id: string;
  key: string;
  skillId: string;
  set: CheckpointSet;
  expiresAt: string;
};

async function readCache(
  skillId: string,
  skillName: string,
  jobId?: string,
): Promise<CheckpointSet | null> {
  if (!isCosmosConfigured()) return null;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const id = cacheKey(skillId, skillName, jobId);
    const { resource } = await container.item(id, id).read<CachedCheckpoint>();
    if (!resource) return null;
    if (new Date(resource.expiresAt).getTime() < Date.now()) return null;
    return resource.set;
  } catch {
    return null;
  }
}

async function writeCache(set: CheckpointSet, jobId?: string): Promise<void> {
  if (!isCosmosConfigured()) return;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const id = cacheKey(set.skillId, set.skillName, jobId);
    const expiresAt = new Date(
      Date.now() + CACHE_TTL_HOURS * 3600 * 1000,
    ).toISOString();
    const doc: CachedCheckpoint = {
      id,
      key: id,
      skillId: set.skillId,
      set,
      expiresAt,
    };
    await container.items.upsert<CachedCheckpoint>(doc);
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
    {
      id: "q4",
      prompt: `Saat tim memintamu mengerjakan tugas ${skillName} yang asing, sikap profesional adalah?`,
      options: [
        "Menolak karena belum pernah mengerjakan",
        "Menerima tugas dan minta waktu untuk pelajari konteksnya",
        "Mengaku bisa lalu copy-paste solusi internet",
        "Diam saja dan kerjakan asal-asalan",
      ],
      correctIndex: 1,
      explanation:
        "Mengakui konteks baru sambil siap belajar adalah perilaku profesional yang dihargai tim.",
    },
    {
      id: "q5",
      prompt: `Kamu menyelesaikan tugas ${skillName} tapi merasa hasilnya bisa lebih baik. Yang paling tepat dilakukan?`,
      options: [
        "Tetap submit tanpa catatan",
        "Submit dengan catatan area yang masih bisa diperbaiki",
        "Tunda submit sampai sempurna",
        "Hapus pekerjaan dan mulai ulang",
      ],
      correctIndex: 1,
      explanation:
        "Self-awareness terhadap area yang bisa diperbaiki menunjukkan growth mindset, bukan kelemahan.",
    },
    {
      id: "q6",
      prompt: `Saat memandu rekan baru tentang ${skillName}, pendekatan yang paling efektif adalah?`,
      options: [
        "Menjelaskan semua sekaligus dalam satu sesi",
        "Memberi tugas tanpa konteks",
        "Mulai dari konsep dasar lalu bertahap ke kasus nyata",
        "Mengarahkan ke dokumentasi tanpa diskusi",
      ],
      correctIndex: 2,
      explanation:
        "Membangun pemahaman bertahap dari dasar lebih efektif daripada infodump satu kali.",
    },
    {
      id: "q7",
      prompt: `Saat menerima feedback negatif tentang pekerjaan ${skillName}-mu, respons paling matang adalah?`,
      options: [
        "Membela diri dan menjelaskan kesalahan orang lain",
        "Menerima feedback, tanya detail, perbaiki di iterasi berikutnya",
        "Diam saja tanpa klarifikasi",
        "Menghindari penilai feedback di masa depan",
      ],
      correctIndex: 1,
      explanation:
        "Menerima feedback dengan terbuka dan minta detail adalah indikator kuat seorang profesional.",
    },
    {
      id: "q8",
      prompt: `Untuk menjaga skill ${skillName}-mu tetap relevan, kebiasaan paling penting adalah?`,
      options: [
        "Mengulang yang sudah dikuasai saja",
        "Sesekali ikut tren tanpa mendalami",
        "Belajar konsisten dan menerapkan di proyek nyata",
        "Menunggu perusahaan memberikan training",
      ],
      correctIndex: 2,
      explanation:
        "Praktik konsisten di konteks nyata membuat skill tidak ketinggalan dan benar-benar tertanam.",
    },
    {
      id: "q9",
      prompt: `Saat ada konflik dengan rekan tentang cara terbaik mengerjakan tugas ${skillName}, kamu sebaiknya?`,
      options: [
        "Memaksakan pendapatmu karena lebih senior",
        "Mengalah saja tanpa diskusi",
        "Diskusikan trade-off masing-masing pendekatan dan cari solusi terbaik",
        "Lapor ke atasan tanpa diskusi langsung",
      ],
      correctIndex: 2,
      explanation:
        "Diskusi terbuka tentang trade-off membantu tim memilih solusi yang paling tepat untuk konteksnya.",
    },
    {
      id: "q10",
      prompt: `Saat mengerjakan tugas ${skillName} dengan deadline ketat, prioritas utamamu adalah?`,
      options: [
        "Menyelesaikan secepatnya tanpa cek kualitas",
        "Memastikan output minimum yang berfungsi, lalu iterasi kalau ada waktu",
        "Memperbaiki kualitas sampai sempurna meskipun terlambat",
        "Minta deadline diperpanjang tanpa upaya dulu",
      ],
      correctIndex: 1,
      explanation:
        "Output minimum yang berfungsi memastikan deliverable terkirim, sambil ruang iterasi tetap terbuka.",
    },
  ];
}

export async function getCheckpointSet(
  skillId: string,
  options: { skillName?: string; jobContext?: Job; candidate?: Candidate } = {},
): Promise<CheckpointSet> {
  const skillName = options.skillName ?? skillById[skillId]?.name ?? skillId;
  const jobId = options.jobContext?.id;

  const cached = await readCache(skillId, skillName, jobId);
  if (cached) return cached;

  if (!isGeminiConfigured()) {
    const set: CheckpointSet = {
      skillId,
      skillName,
      questions: fallbackQuestions(skillName),
      generatedAt: new Date().toISOString(),
      generatedBy: "fallback",
    };
    await writeCache(set, jobId);
    return set;
  }

  const jobHint = options.jobContext
    ? `Konteks lowongan target: posisi "${options.jobContext.title}" di ${options.jobContext.company}. Buat soal yang relevan dengan cara skill "${skillName}" dipakai pada pekerjaan itu, bukan profesi lain.`
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
      prompt: `Buat ${QUESTION_COUNT} soal pilihan ganda untuk menguji pemahaman dasar skill "${skillName}".

${jobHint}

Aturan:
- Buat tepat ${QUESTION_COUNT} soal.
- Setiap soal punya 4 pilihan (A, B, C, D), tepat satu jawaban benar.
- Pertanyaan menguji pemahaman konsep atau pengambilan keputusan, bukan menghafal sintaks atau angka.
- Pakai bahasa Indonesia lugas, kalimat pendek.
- Tambahkan penjelasan singkat (1-2 kalimat) kenapa jawaban benar.
- Jangan sebut "kursus", "buka materi", atau "pelajari dulu" di pertanyaan; pertanyaan harus bisa berdiri sendiri.
- Variasikan kesulitan dan sudut pertanyaan supaya tidak repetitif.

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
      maxOutputTokens: 4000,
    });

    const questions: CheckpointQuestion[] = (raw.questions ?? [])
      .slice(0, QUESTION_COUNT)
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

    if (questions.length < QUESTION_COUNT) {
      throw new Error(
        `AI returned ${questions.length} valid questions, expected ${QUESTION_COUNT}`,
      );
    }

    const set: CheckpointSet = {
      skillId,
      skillName,
      questions,
      generatedAt: new Date().toISOString(),
      generatedBy: "ai",
    };
    await writeCache(set, jobId);
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
    await writeCache(set, jobId);
    return set;
  }
}

import { generateGeminiJson } from "../ai/gemini-json";
import type { PracticeRubricCriterion, PracticeTask } from "../shared/types";

export type AiCriterionResult = {
  criterion: PracticeRubricCriterion;
  score: number;
  feedback: string;
};

export type AiGradeResult = {
  totalScore: number;
  perCriterion: AiCriterionResult[];
  overallFeedback: string;
};

type RawAiOutput = {
  criteria: {
    id: string;
    score: number;
    feedback: string;
  }[];
  overallFeedback: string;
};

const SYSTEM_INSTRUCTION = `Kamu adalah evaluator latihan kerja untuk pencari kerja Indonesia di platform Akselerja.

Tugasmu: nilai jawaban kandidat terhadap satu studi kasus / roleplay / review dokumen, ikuti rubric yang diberikan.

Aturan penting:
- Bahasa Indonesia ramah, jelas, ringkas. Tidak formal kaku.
- JANGAN pakai em dash (—). Pakai koma, titik dua, atau hyphen biasa.
- JANGAN sebut Azure, Gemini, OpenAI, atau Google di feedback.
- Skor per kriteria 0-100. Hindari skor sempurna 100 kecuali jawaban benar-benar exemplary.
- Penalti besar untuk:
  - Jawaban yang hanya copy-paste keyword tanpa konteks (skor maks 40).
  - Jawaban kurang dari 50 kata (skor maks 35).
  - Jawaban yang tidak relevan dengan scenario (skor maks 25).
  - Jawaban general AI generic tanpa decision konkret (skor maks 50).
- Feedback per kriteria 1-2 kalimat: yang sudah baik + yang masih kurang.
- Overall feedback 2-3 kalimat: ringkasan + 1 saran konkret untuk improve.

Output: JSON sesuai schema. Tidak ada teks tambahan di luar JSON.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          score: { type: "number" },
          feedback: { type: "string" },
        },
        required: ["id", "score", "feedback"],
      },
    },
    overallFeedback: { type: "string" },
  },
  required: ["criteria", "overallFeedback"],
};

function buildPrompt(task: PracticeTask, answer: string): string {
  const rubricBlock = task.rubric
    .map(
      (c) =>
        `- id: ${c.id}\n  nama: ${c.name}\n  bobot: ${c.weight}%\n  deskripsi: ${c.description}\n  sinyal yang dicari: ${c.signals.join(", ")}`,
    )
    .join("\n");

  const evidenceBlock = task.expectedEvidence?.length
    ? task.expectedEvidence.map((e, i) => `${i + 1}. ${e}`).join("\n")
    : "(tidak disebut)";

  return `LATIHAN: ${task.title}
Tipe: ${task.type}
Skill yang dilatih: ${task.skillId}

SCENARIO:
${task.scenario}

INSTRUKSI YANG DIBERIKAN KE KANDIDAT:
${task.instructions.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

EVIDENCE YANG DIHARAPKAN:
${evidenceBlock}

RUBRIC PENILAIAN:
${rubricBlock}

JAWABAN KANDIDAT:
${answer.trim()}

Nilai jawaban di atas. Kembalikan JSON dengan field criteria (array) dan overallFeedback (string). Field id di criteria harus match dengan id rubric.`;
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export async function gradePracticeAnswerWithAi(
  task: PracticeTask,
  answer: string,
): Promise<AiGradeResult> {
  const raw = await generateGeminiJson<RawAiOutput>({
    prompt: buildPrompt(task, answer),
    systemInstruction: SYSTEM_INSTRUCTION,
    responseSchema: RESPONSE_SCHEMA,
    temperature: 0.3,
    maxOutputTokens: 1400,
  });

  const perCriterion: AiCriterionResult[] = task.rubric.map((criterion) => {
    const match = raw.criteria.find((c) => c.id === criterion.id);
    return {
      criterion,
      score: clampScore(match?.score),
      feedback:
        match?.feedback?.trim() ||
        "Tidak ada feedback spesifik untuk kriteria ini.",
    };
  });

  const totalScore = Math.round(
    perCriterion.reduce(
      (sum, r) => sum + r.score * (r.criterion.weight / 100),
      0,
    ),
  );

  return {
    totalScore: Math.max(0, Math.min(100, totalScore)),
    perCriterion,
    overallFeedback:
      raw.overallFeedback?.trim() ||
      "Lanjutkan latihan untuk meningkatkan jawaban.",
  };
}

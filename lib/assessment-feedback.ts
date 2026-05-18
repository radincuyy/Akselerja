import { GoogleGenAI } from "@google/genai";
import { skillById } from "./skills";
import { findCoursesForGapsAsync } from "./courses-store";
import type { Candidate, Course, Job } from "./types";
import { calcMatch } from "./match";

const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";

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

const SYSTEM_INSTRUCTION = `Kamu adalah pendamping karier untuk pencari kerja Indonesia di platform Akselerja.

Tugasmu: kasih feedback singkat dan personal setelah user menyelesaikan tes skill. Tujuan utama adalah memberi user satu langkah konkret berikutnya.

Aturan:
- Bahasa Indonesia hangat, langsung ke poin. Tidak boleh formal kaku.
- JANGAN pakai em dash atau en dash. Pakai koma, titik dua, atau hyphen biasa.
- JANGAN sebut Azure, Gemini, OpenAI, atau Google.
- Kalau user lulus, akui pencapaiannya, sebutkan satu lowongan target yang minta skill ini, dan tip kecil untuk lanjut belajar.
- Kalau user belum lulus, jelaskan dengan empati, sebut satu materi konkret di catalog kami sebagai langkah pertama.
- 3-4 kalimat. Tidak ada heading, tidak ada list, tidak ada bullet.`;

export type AssessmentFeedbackInput = {
  profile: Candidate;
  skillId: string;
  skillName: string;
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  topJobsRequiringSkill: Job[];
  recommendedCourses: Course[];
};

export async function generateAssessmentFeedback(
  input: AssessmentFeedbackInput,
): Promise<string> {
  const jobsList = input.topJobsRequiringSkill.slice(0, 3).map((j) => {
    const reqs = j.requirements ?? [];
    const must = reqs.find((r) => r.skillId === input.skillId)?.mustHave;
    return `- ${j.title} di ${j.company} (${must ? "wajib" : "nice-to-have"})`;
  });

  const coursesList = input.recommendedCourses
    .slice(0, 3)
    .map((c) => `- ${c.title} (${c.provider}, ${c.durationHours} jam${c.free ? ", gratis" : ""})`);

  const haveSkillsText = (input.profile.skills ?? [])
    .map((s) => skillById[s.skillId]?.name ?? s.skillId)
    .filter(Boolean)
    .slice(0, 8)
    .join(", ") || "(belum ada skill di profil)";

  const prompt = `HASIL TES:
- Skill: ${input.skillName}
- Skor: ${input.score}/100 (${input.correct} dari ${input.total} benar)
- Status: ${input.passed ? "Lulus" : "Belum lulus"}

PROFIL USER:
- Skill yang sudah dimiliki: ${haveSkillsText}

LOWONGAN TOP YANG MEMINTA SKILL INI:
${jobsList.length ? jobsList.join("\n") : "(tidak ada di top match user saat ini)"}

KURSUS YANG TERSEDIA UNTUK SKILL INI:
${coursesList.length ? coursesList.join("\n") : "(tidak ada kursus terkurasi)"}

Tulis 3-4 kalimat feedback personal untuk user.`;

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        maxOutputTokens: 280,
      },
    });
    const text = response.text?.trim();
    if (!text) return defaultFeedback(input);
    return text;
  } catch (err) {
    console.warn("[assessment-feedback] generation failed:", err);
    return defaultFeedback(input);
  }
}

function defaultFeedback(input: AssessmentFeedbackInput): string {
  if (input.passed) {
    return `Skor ${input.skillName}-mu ${input.score}, dan skill ini sudah masuk profilmu. Match score lowonganmu yang minta skill ini akan ikut naik. Lanjutkan dengan menutup gap berikutnya di halaman Belajar.`;
  }
  return `Skor ${input.skillName}-mu ${input.score}, jadi belum cukup untuk masuk profil otomatis. Coba ambil materi paling dasar dulu, lalu kerjakan ulang tes ini setelah kamu merasa lebih siap. Tidak apa-apa kalau butuh dua atau tiga kali percobaan.`;
}

/**
 * Helper that searches the user's top jobs for ones that require the given
 * skill, plus the matching course catalog. Returns an empty list gracefully so
 * the feedback prompt remains usable even with sparse data.
 */
export async function gatherFeedbackContext(
  profile: Candidate,
  skillId: string,
  rankedJobs: Job[],
): Promise<{ jobs: Job[]; courses: Course[] }> {
  const jobs = rankedJobs
    .filter((j) =>
      (j.requirements ?? []).some((r) => r.skillId === skillId),
    )
    .slice(0, 3);
  // Sort by match score so the most relevant job leads.
  jobs.sort((a, b) => calcMatch(profile, b).score - calcMatch(profile, a).score);
  const courses = await findCoursesForGapsAsync([skillId], 3);
  return { jobs, courses };
}

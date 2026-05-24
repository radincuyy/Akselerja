import type { PracticeTask } from "./types";
import { CONTAINERS, getContainer } from "./db";
import { skillById } from "./skills";

const SYNTHETIC_PRACTICE_PREFIX = "skill-drill-";

function createSyntheticPracticeTask(skillId: string): PracticeTask {
  const name = skillById[skillId]?.name ?? skillId;
  return {
    id: `${SYNTHETIC_PRACTICE_PREFIX}${skillId}`,
    slug: `${SYNTHETIC_PRACTICE_PREFIX}${skillId}`,
    role: "Latihan mandiri",
    title: `Latihan praktik ${name}`,
    skillId,
    type: "case-simulation",
    estimatedMinutes: 10,
    sourceLabel: "Akselerja Skill Drill",
    sourceNotes: [
      "Latihan fallback dibuat otomatis ketika belum ada materi terkurasi untuk skill ini.",
      "Gunakan jawaban konkret agar rubrik bisa membaca bukti kemampuanmu.",
    ],
    scenario: `Kamu sedang diminta membuktikan kemampuan ${name} untuk lowongan target. HR tidak hanya ingin melihat nama skill di profil, tetapi contoh cara kamu menerapkannya dalam situasi kerja.`,
    instructions: [
      `Jelaskan satu kasus kerja yang membutuhkan ${name}.`,
      "Tuliskan langkah yang kamu ambil dari awal sampai akhir.",
      "Sebutkan alat, data, dokumen, atau pihak yang kamu libatkan jika relevan.",
      "Tutup dengan hasil yang diharapkan dan cara mengecek kualitas pekerjaanmu.",
    ],
    expectedEvidence: [
      `Ada contoh kasus konkret terkait ${name}.`,
      "Ada urutan langkah kerja yang jelas.",
      "Ada alasan di balik keputusan atau prioritas.",
      "Ada ukuran hasil, risiko, atau cara validasi pekerjaan.",
    ],
    rubric: [
      {
        id: "context",
        name: "Konteks kasus",
        description: `Jawaban menjelaskan situasi kerja yang relevan dengan ${name}.`,
        weight: 25,
        signals: [name, "kasus", "situasi", "kebutuhan", "masalah"],
      },
      {
        id: "workflow",
        name: "Langkah kerja",
        description: "Jawaban punya alur tindakan yang runtut dan bisa diikuti.",
        weight: 35,
        signals: ["langkah", "proses", "cek", "prioritas", "dokumen"],
      },
      {
        id: "reasoning",
        name: "Alasan keputusan",
        description: "Jawaban menunjukkan alasan di balik tindakan yang dipilih.",
        weight: 20,
        signals: ["karena", "alasan", "risiko", "kendala", "keputusan"],
      },
      {
        id: "outcome",
        name: "Hasil dan validasi",
        description: "Jawaban menyebut hasil, ukuran sukses, atau cara verifikasi.",
        weight: 20,
        signals: ["hasil", "validasi", "ukur", "laporan", "perbaikan"],
      },
    ],
  };
}

function syntheticSkillIdFromSlug(slug: string): string | null {
  if (!slug.startsWith(SYNTHETIC_PRACTICE_PREFIX)) return null;
  return slug.slice(SYNTHETIC_PRACTICE_PREFIX.length) || null;
}

export async function listPracticeTasksAsync(): Promise<PracticeTask[]> {
  const container = getContainer(CONTAINERS.practiceTasks);
  const { resources } = await container.items
    .query<PracticeTask>({ query: "SELECT * FROM c" })
    .fetchAll();
  const coveredSkillIds = new Set(resources.map((task) => task.skillId));
  const syntheticTasks = Object.keys(skillById)
    .filter((skillId) => !coveredSkillIds.has(skillId))
    .map(createSyntheticPracticeTask);
  return [...resources, ...syntheticTasks];
}

export async function getPracticeTaskBySlugAsync(
  slug: string,
): Promise<PracticeTask | undefined> {
  const container = getContainer(CONTAINERS.practiceTasks);
  const { resources } = await container.items
    .query<PracticeTask>({
      query: "SELECT * FROM c WHERE c.slug = @slug",
      parameters: [{ name: "@slug", value: slug }],
    })
    .fetchAll();
  if (resources[0]) return resources[0];

  const syntheticSkillId = syntheticSkillIdFromSlug(slug);
  return syntheticSkillId ? createSyntheticPracticeTask(syntheticSkillId) : undefined;
}

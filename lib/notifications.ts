import { skillById } from "./skills";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
};

type LatestAssessment = {
  id: string;
  skillId: string;
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  takenAt: string;
};

type LatestPractice = {
  id: string;
  taskTitle: string;
  skillId: string;
  score: number;
  passed: boolean;
  completedAt: string;
};

function formatRelativeTime(value?: string): string {
  if (!value) return "Baru saja";

  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "Baru saja";

  const diffMs = Date.now() - then;
  if (diffMs < 60_000) return "Baru saja";

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Kemarin";
  return `${diffDays} hari lalu`;
}

export function buildNotifications(input: {
  hasCv?: boolean;
  skillCount?: number;
  readinessScore?: number;
  latestAssessment?: LatestAssessment;
  latestPractice?: LatestPractice;
}): AppNotification[] {
  const hasCv = Boolean(input.hasCv);
  const skillCount = input.skillCount ?? 0;
  const readinessScore = input.readinessScore ?? 0;
  const latestAssessment = input.latestAssessment;
  const latestPractice = input.latestPractice;
  const latestPracticeNotification: AppNotification[] = latestPractice
    ? [
        {
          id: `practice-attempt-${latestPractice.id}`,
          title: "Belajar selesai",
          body: latestPractice.passed
            ? `${latestPractice.taskTitle} selesai dengan skor ${latestPractice.score}%. Skill ${skillById[latestPractice.skillId]?.name ?? "ini"} sudah memperkuat profilmu.`
            : `${latestPractice.taskTitle} selesai dengan skor ${latestPractice.score}%. Perbaiki jawaban untuk menaikkan bukti skill.`,
          time: formatRelativeTime(latestPractice.completedAt),
          unread: true,
        },
      ]
    : [];
  const latestAssessmentNotification: AppNotification[] = latestAssessment
    ? [
        {
          id: `assessment-attempt-${latestAssessment.id}`,
          title: latestAssessment.passed
            ? "Assessment berhasil diselesaikan"
            : "Assessment selesai",
          body: latestAssessment.passed
            ? `Kamu lulus ${skillById[latestAssessment.skillId]?.name ?? "assessment"} dengan skor ${latestAssessment.score}%. Skill ini sudah membantu memperkuat profilmu.`
            : `Skor ${latestAssessment.score}% untuk ${skillById[latestAssessment.skillId]?.name ?? "assessment"}. Pelajari lagi materinya, lalu coba ulang assessment.`,
          time: formatRelativeTime(latestAssessment.takenAt),
          unread: true,
        },
      ]
    : [];

  return [
    ...latestPracticeNotification,
    ...latestAssessmentNotification,
    {
      id: "profile",
      title: hasCv ? "Profil kamu bisa diperbarui" : "Upload CV untuk mulai cepat",
      body: hasCv
        ? "Tambahkan pengalaman atau project terbaru supaya rekomendasi lowongan lebih akurat."
        : "Upload CV agar skill, pengalaman, dan pendidikan bisa terbantu terisi otomatis.",
      time: "Baru saja",
      unread: true,
    },
    {
      id: "jobs",
      title: "Lowongan baru tersedia",
      body:
        skillCount > 0
          ? "Ada beberapa lowongan yang bisa dicocokkan dengan skill di profilmu."
          : "Tambahkan skill supaya lowongan yang tampil bisa lebih personal.",
      time: "12 menit lalu",
      unread: true,
    },
    {
      id: "assessment-next",
      title: "Assessment berikutnya menunggu",
      body:
        readinessScore >= 70
          ? "Satu assessment lagi bisa membantu memperkuat bukti kesiapan kerjamu."
          : "Selesaikan satu assessment untuk menaikkan skor kesiapan kerja.",
      time: "1 jam lalu",
    },
    {
      id: "coach",
      title: "Coach siap membantu",
      body: "Tanyakan langkah paling berdampak untuk meningkatkan peluang interview.",
      time: "2 jam lalu",
    },
    {
      id: "learning",
      title: "Materi belajar direkomendasikan",
      body: "Lihat materi yang menutup skill gap dari lowongan targetmu.",
      time: "3 jam lalu",
    },
    {
      id: "settings",
      title: "Preferensi akun bisa disesuaikan",
      body: "Cek pengaturan jika ingin mengubah visibilitas profil atau preferensi akun.",
      time: "Kemarin",
    },
  ];
}

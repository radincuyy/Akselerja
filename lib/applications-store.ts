import type {
  Application,
  ApplicationEvent,
  ApplicationStatus,
  HrNote,
  RejectReasonId,
} from "./types";
import { calcMatch, candidates, jobs } from "./mock-data";

// Single-process in-memory store, resets on server restart. For demo only.
// In production this is Cosmos DB / SQL.

let initialised = false;
const applications: Application[] = [];
const notes: HrNote[] = [];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seed() {
  if (initialised) return;
  initialised = true;

  // Seed: persona "me" sudah punya 3 lamaran dengan status berbeda untuk demo.
  const meId = "me";
  const seedDefs: Array<{
    jobId: string;
    status: ApplicationStatus;
    daysAgo: number;
    rejectReason?: RejectReasonId;
    history: Array<{ status: ApplicationStatus; daysAgo: number; by: ApplicationEvent["by"] }>;
  }> = [
    {
      jobId: "j-001",
      status: "invited",
      daysAgo: 5,
      history: [
        { status: "submitted", daysAgo: 5, by: "candidate" },
        { status: "reviewing", daysAgo: 4, by: "hr" },
        { status: "invited", daysAgo: 1, by: "hr" },
      ],
    },
    {
      jobId: "j-006",
      status: "reviewing",
      daysAgo: 3,
      history: [
        { status: "submitted", daysAgo: 3, by: "candidate" },
        { status: "reviewing", daysAgo: 1, by: "hr" },
      ],
    },
    {
      jobId: "j-005",
      status: "submitted",
      daysAgo: 0,
      history: [{ status: "submitted", daysAgo: 0, by: "candidate" }],
    },
  ];

  const cand = candidates.find((c) => c.id === meId);
  if (!cand) return;

  for (const def of seedDefs) {
    const job = jobs.find((j) => j.id === def.jobId);
    if (!job) continue;
    const score = calcMatch(cand, job).score;
    applications.push({
      id: uid("ap"),
      candidateId: meId,
      jobId: def.jobId,
      status: def.status,
      scoreAtApply: score,
      createdAt: daysAgo(def.daysAgo),
      history: def.history.map((h) => ({
        status: h.status,
        at: daysAgo(h.daysAgo),
        by: h.by,
      })),
      rejectReason: def.rejectReason,
    });
  }

  // Other candidates also have applications across the active jobs, so HR
  // pipeline isn't empty for any job.
  const otherCandidates = candidates.filter((c) => c.id !== meId);
  const hrSeed: Array<{ candId: string; jobId: string; status: ApplicationStatus; daysAgo: number; rating?: 1 | 2 | 3 | 4 | 5 }> = [
    { candId: "c-002", jobId: "j-001", status: "invited", daysAgo: 6, rating: 4 },
    { candId: "c-003", jobId: "j-001", status: "submitted", daysAgo: 1 },
    { candId: "c-004", jobId: "j-001", status: "reviewing", daysAgo: 4, rating: 5 },
    { candId: "c-005", jobId: "j-001", status: "submitted", daysAgo: 0 },
    { candId: "c-002", jobId: "j-002", status: "submitted", daysAgo: 2 },
    { candId: "c-004", jobId: "j-003", status: "reviewing", daysAgo: 5, rating: 5 },
    { candId: "c-005", jobId: "j-004", status: "submitted", daysAgo: 1 },
    { candId: "c-003", jobId: "j-005", status: "submitted", daysAgo: 0 },
    { candId: "c-002", jobId: "j-006", status: "submitted", daysAgo: 1 },
  ];
  for (const s of hrSeed) {
    const cnd = otherCandidates.find((c) => c.id === s.candId);
    const job = jobs.find((j) => j.id === s.jobId);
    if (!cnd || !job) continue;
    const score = calcMatch(cnd, job).score;
    const history: ApplicationEvent[] = [
      { status: "submitted", at: daysAgo(s.daysAgo), by: "candidate" },
    ];
    if (s.status === "reviewing" || s.status === "invited" || s.status === "accepted" || s.status === "rejected") {
      history.push({ status: "reviewing", at: daysAgo(Math.max(0, s.daysAgo - 1)), by: "hr" });
    }
    if (s.status === "invited" || s.status === "accepted" || s.status === "rejected") {
      history.push({ status: s.status, at: daysAgo(Math.max(0, s.daysAgo - 2)), by: "hr" });
    }
    applications.push({
      id: uid("ap"),
      candidateId: s.candId,
      jobId: s.jobId,
      status: s.status,
      scoreAtApply: score,
      createdAt: daysAgo(s.daysAgo),
      history,
      hrRating: s.rating,
    });
  }

  // A starter HR note on Mira (top performer) to show how panel feels populated.
  const sample = applications.find((a) => a.candidateId === "c-004" && a.jobId === "j-001");
  if (sample) {
    notes.push({
      id: uid("nt"),
      applicationId: sample.id,
      text: "Pengalaman implementasi WMS-nya pas dengan kebutuhan tim. Cek availability minggu depan.",
      createdAt: daysAgo(3),
      authorName: "Sari Wijaya",
    });
  }
}

// --- Public API ---

export function listApplicationsForCandidate(candidateId: string): Application[] {
  seed();
  return applications
    .filter((a) => a.candidateId === candidateId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function listApplicationsForJob(jobId: string): Application[] {
  seed();
  return applications
    .filter((a) => a.jobId === jobId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getApplication(id: string): Application | undefined {
  seed();
  return applications.find((a) => a.id === id);
}

export function findApplication(candidateId: string, jobId: string): Application | undefined {
  seed();
  return applications.find((a) => a.candidateId === candidateId && a.jobId === jobId);
}

export function createApplication(candidateId: string, jobId: string): Application {
  seed();
  const existing = findApplication(candidateId, jobId);
  if (existing) return existing;

  const cand = candidates.find((c) => c.id === candidateId);
  const job = jobs.find((j) => j.id === jobId);
  if (!cand || !job) {
    throw new Error("Kandidat atau lowongan tidak ditemukan.");
  }
  const score = calcMatch(cand, job).score;
  const now = new Date().toISOString();
  const application: Application = {
    id: uid("ap"),
    candidateId,
    jobId,
    status: "submitted",
    scoreAtApply: score,
    createdAt: now,
    history: [{ status: "submitted", at: now, by: "candidate" }],
  };
  applications.push(application);
  return application;
}

export function setStatus(
  applicationId: string,
  status: ApplicationStatus,
  by: ApplicationEvent["by"],
  options?: { rejectReason?: RejectReasonId },
): Application | undefined {
  seed();
  const app = applications.find((a) => a.id === applicationId);
  if (!app) return;
  if (app.status === status) return app;
  app.status = status;
  app.history.push({ status, at: new Date().toISOString(), by });
  if (status === "rejected" && options?.rejectReason) {
    app.rejectReason = options.rejectReason;
  }
  if (status !== "rejected") {
    app.rejectReason = undefined;
  }
  return app;
}

export function setRating(applicationId: string, rating: 1 | 2 | 3 | 4 | 5 | 0): Application | undefined {
  seed();
  const app = applications.find((a) => a.id === applicationId);
  if (!app) return;
  app.hrRating = rating === 0 ? undefined : rating;
  return app;
}

export function markCandidateSeen(applicationId: string) {
  seed();
  const app = applications.find((a) => a.id === applicationId);
  if (!app) return;
  app.candidateSeenAt = new Date().toISOString();
}

export function listNotes(applicationId: string): HrNote[] {
  seed();
  return notes
    .filter((n) => n.applicationId === applicationId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function addNote(applicationId: string, text: string, authorName = "Kamu"): HrNote | undefined {
  seed();
  const trimmed = text.trim();
  if (!trimmed) return;
  const note: HrNote = {
    id: uid("nt"),
    applicationId,
    text: trimmed,
    createdAt: new Date().toISOString(),
    authorName,
  };
  notes.push(note);
  return note;
}

// --- Helpers used by UI ---

export function isUpdatedSinceSeen(app: Application): boolean {
  if (!app.candidateSeenAt) {
    // Never opened: any status beyond submitted is "new"
    return app.status !== "submitted";
  }
  const lastChange = app.history[app.history.length - 1]?.at;
  if (!lastChange) return false;
  return +new Date(lastChange) > +new Date(app.candidateSeenAt);
}

export function statusLabel(s: ApplicationStatus): string {
  switch (s) {
    case "submitted":
      return "Terkirim";
    case "reviewing":
      return "Direview";
    case "invited":
      return "Diundang interview";
    case "accepted":
      return "Diterima";
    case "rejected":
      return "Ditolak";
  }
}

export function statusOrder(): ApplicationStatus[] {
  return ["submitted", "reviewing", "invited", "accepted"];
}

export function statusGroup(s: ApplicationStatus): "open" | "closed" {
  return s === "accepted" || s === "rejected" ? "closed" : "open";
}

export const REJECT_REASONS: Array<{
  id: RejectReasonId;
  label: string;
  candidateMessage: string;
}> = [
  {
    id: "skill-gap",
    label: "Skill kunci belum cukup",
    candidateMessage:
      "Untuk posisi ini, ada beberapa skill kunci yang belum kamu miliki di level yang dibutuhkan. Lihat rekomendasi kursus di bawah, mulai dari yang paling cepat selesai.",
  },
  {
    id: "experience",
    label: "Pengalaman belum cukup",
    candidateMessage:
      "Posisi ini mencari kandidat dengan pengalaman lebih banyak. Coba lamar posisi entry-level atau magang dengan deskripsi serupa, lalu kembali ke level ini setelah satu hingga dua tahun pengalaman.",
  },
  {
    id: "location",
    label: "Lokasi terlalu jauh",
    candidateMessage:
      "Posisi ini di lokasi yang jauh dari domisilimu. Filter pencarianmu sudah kami siapkan untuk lowongan serupa di sekitar lokasimu.",
  },
  {
    id: "salary",
    label: "Ekspektasi gaji tidak cocok",
    candidateMessage:
      "Ekspektasi gajimu di atas anggaran posisi ini. Lihat lowongan dengan rentang yang lebih dekat dengan ekspektasimu, atau pertimbangkan posisi dengan kebutuhan skill yang lebih tinggi untuk gaji setara.",
  },
  {
    id: "filled",
    label: "Posisi sudah diisi",
    candidateMessage:
      "Posisi ini sudah diisi kandidat lain, bukan karena profilmu kurang. Lihat lowongan lain di industri yang sama; profilmu cocok untuk beberapa di antaranya.",
  },
];

export function rejectReasonById(id?: RejectReasonId) {
  return REJECT_REASONS.find((r) => r.id === id);
}

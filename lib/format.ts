// Pure formatters and label helpers. No data, no side effects.
// Safe to import from server or client components.

// Mock assessment completion. In production this is per-user state from Cosmos.
export const completedAssessmentIds = new Set(["a-001"]);

export function formatIdr(amount: number, locale = "id-ID") {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateId(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatRelativeId(iso: string, now: Date = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const ms = now.getTime() - d.getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  if (day < 30) return `${Math.round(day / 7)} minggu lalu`;
  if (day < 365) return `${Math.round(day / 30)} bulan lalu`;
  return `${Math.round(day / 365)} tahun lalu`;
}

export function levelLabel(n: number) {
  if (n >= 3) return "Mahir";
  if (n === 2) return "Menengah";
  if (n === 1) return "Dasar";
  return "Belum ada";
}

// Score band: same boundaries as score tone (75/50). Used for color-blind-safe
// labeling alongside the colored number.
export type ScoreBand = "siap" | "trainable" | "jauh";

export function scoreBand(score: number): ScoreBand {
  if (score >= 75) return "siap";
  if (score >= 50) return "trainable";
  return "jauh";
}

export type ScoreAudience = "candidate" | "hr";

// Audience matters: PRODUCT.md says candidate-side never uses shame language.
// HR-side describes pipeline state directly. Same band, different framing.
export function scoreBandLabel(
  score: number,
  audience: ScoreAudience = "candidate",
): string {
  const band = scoreBand(score);
  if (audience === "hr") {
    if (band === "siap") return "Siap kerja";
    if (band === "trainable") return "Trainable";
    return "Masih jauh";
  }
  // Candidate-facing: focus on what is, not what's missing.
  if (band === "siap") return "Cocok";
  if (band === "trainable") return "Bisa dikejar";
  return "Butuh persiapan";
}

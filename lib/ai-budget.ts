export class QuotaError extends Error {
  readonly code = "AI_QUOTA_EXCEEDED";
  constructor(message = "Kuota AI harian sudah habis. Coba lagi besok.") {
    super(message);
    this.name = "QuotaError";
  }
}

export function isQuotaError(err: unknown): err is QuotaError {
  return (
    err instanceof QuotaError ||
    (typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "AI_QUOTA_EXCEEDED")
  );
}

function dailyLimit(): number {
  const parsed = Number.parseInt(
    process.env.GEMINI_DAILY_BUDGET?.trim() ?? "",
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1500;
}

let dayKey = "";
let count = 0;

function currentDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function reserveGeminiCall(): void {
  const today = currentDay();
  if (today !== dayKey) {
    dayKey = today;
    count = 0;
  }
  if (count >= dailyLimit()) {
    throw new QuotaError();
  }
  count += 1;
}

export function geminiBudgetStatus(): {
  used: number;
  limit: number;
  day: string;
} {
  return { used: count, limit: dailyLimit(), day: dayKey || currentDay() };
}

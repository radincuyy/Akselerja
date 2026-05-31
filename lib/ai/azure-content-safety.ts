const DEFAULT_API_VERSION = "2024-09-01";
const DEFAULT_BLOCK_SEVERITY = 4;
const MAX_TEXT_CHARS = 10000;

type HarmCategory = "Hate" | "SelfHarm" | "Sexual" | "Violence";

export type ContentSafetyCategory = {
  category: HarmCategory;
  severity: number;
};

export type ContentSafetyResult = {
  checked: boolean;
  allowed: boolean;
  categories: ContentSafetyCategory[];
  maxSeverity: number;
  reason?: string;
};

type AnalyzeTextResponse = {
  categoriesAnalysis?: Array<{
    category?: unknown;
    severity?: unknown;
  }>;
};

const CATEGORIES: HarmCategory[] = ["Hate", "SelfHarm", "Sexual", "Violence"];

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function endpoint(): string {
  return (
    env("AZURE_CONTENT_SAFETY_ENDPOINT") ||
    env("AZURE_AI_CONTENT_SAFETY_ENDPOINT")
  );
}

function apiKey(): string {
  return env("AZURE_CONTENT_SAFETY_KEY") || env("AZURE_AI_CONTENT_SAFETY_KEY");
}

function apiVersion(): string {
  return env("AZURE_CONTENT_SAFETY_API_VERSION") || DEFAULT_API_VERSION;
}

function isDisabled(): boolean {
  return env("AZURE_CONTENT_SAFETY_ENABLED") === "0";
}

function failClosed(): boolean {
  return env("AZURE_CONTENT_SAFETY_FAIL_CLOSED") === "1";
}

function blockSeverity(): number {
  const configured = Number(env("AZURE_CONTENT_SAFETY_BLOCK_SEVERITY"));
  if (!Number.isFinite(configured) || configured < 0) {
    return DEFAULT_BLOCK_SEVERITY;
  }
  return Math.round(configured);
}

function normalizeEndpoint(value: string): string {
  return value.replace(/\/+$/, "");
}

export function isContentSafetyConfigured(): boolean {
  return Boolean(endpoint() && apiKey()) && !isDisabled();
}

export function shouldCheckGeneratedTextSafety(): boolean {
  return env("AZURE_CONTENT_SAFETY_CHECK_OUTPUT") === "1";
}

let _warnedUnconfigured = false;
function warnUnconfiguredOnce(): void {
  if (_warnedUnconfigured) return;
  _warnedUnconfigured = true;
  console.warn(
    "[content-safety] AZURE_CONTENT_SAFETY_* not configured: moderation is " +
      "DISABLED (fail-open). Coach input/output is not screened. Set the " +
      "Content Safety env vars to enable.",
  );
}

export async function analyzeTextSafety(
  text: string,
): Promise<ContentSafetyResult> {
  const cleaned = text.trim();
  if (!cleaned) {
    return {
      checked: false,
      allowed: true,
      categories: [],
      maxSeverity: 0,
    };
  }

  if (!isContentSafetyConfigured()) {
    warnUnconfiguredOnce();
    return {
      checked: false,
      allowed: true,
      categories: [],
      maxSeverity: 0,
      reason: "content-safety-not-configured",
    };
  }

  try {
    const url = `${normalizeEndpoint(endpoint())}/contentsafety/text:analyze?api-version=${encodeURIComponent(
      apiVersion(),
    )}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": apiKey(),
      },
      body: JSON.stringify({
        text: cleaned.slice(0, MAX_TEXT_CHARS),
        categories: CATEGORIES,
        outputType: "FourSeverityLevels",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Content Safety failed: ${res.status} ${detail.slice(0, 240)}`,
      );
    }

    const data = (await res.json()) as AnalyzeTextResponse;
    const categories = (data.categoriesAnalysis ?? [])
      .map((item): ContentSafetyCategory | null => {
        const category = String(item.category ?? "") as HarmCategory;
        if (!CATEGORIES.includes(category)) return null;
        const severity =
          typeof item.severity === "number" ? item.severity : 0;
        return { category, severity };
      })
      .filter((item): item is ContentSafetyCategory => Boolean(item));
    const maxSeverity = categories.reduce(
      (max, item) => Math.max(max, item.severity),
      0,
    );
    return {
      checked: true,
      allowed: maxSeverity < blockSeverity(),
      categories,
      maxSeverity,
    };
  } catch (err) {
    console.warn("[content-safety] analysis failed:", err);
    return {
      checked: false,
      allowed: !failClosed(),
      categories: [],
      maxSeverity: 0,
      reason: "content-safety-error",
    };
  }
}

export function contentSafetyBlockedMessage(): string {
  return "Pesan ini belum bisa dikirim. Coba tulis ulang dengan bahasa yang lebih aman dan tetap fokus ke tujuan kariermu.";
}

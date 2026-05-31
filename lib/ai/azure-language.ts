import type { ParsedCv } from "../profile/cv-parser";
import type { CvLanguageEntity, CvLanguageInsights } from "../shared/types";

const DEFAULT_API_VERSION = "2024-11-01";
const DEFAULT_MAX_CV_TEXT_CHARS = 4500;

type AnalyzeKind = "KeyPhraseExtraction" | "EntityRecognition";

type LanguageDocument = {
  id: string;
  language?: string;
  text: string;
};

type KeyPhraseDocumentResult = {
  id?: string;
  keyPhrases?: unknown[];
};

type EntityDocumentResult = {
  id?: string;
  entities?: Array<{
    text?: unknown;
    category?: unknown;
    type?: unknown;
    confidenceScore?: unknown;
  }>;
};

type AnalyzeTextResponse = {
  results?: {
    documents?: unknown[];
    errors?: unknown[];
    modelVersion?: string;
  };
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function endpoint(): string {
  return env("AZURE_LANGUAGE_ENDPOINT") || env("AZURE_AI_LANGUAGE_ENDPOINT");
}

function apiKey(): string {
  return env("AZURE_LANGUAGE_KEY") || env("AZURE_AI_LANGUAGE_KEY");
}

function apiVersion(): string {
  return env("AZURE_LANGUAGE_API_VERSION") || DEFAULT_API_VERSION;
}

function documentLanguage(): string | undefined {
  return env("AZURE_LANGUAGE_DOCUMENT_LANGUAGE") || "id";
}

function maxCvTextChars(): number {
  const configured = Number(env("AZURE_LANGUAGE_CV_MAX_CHARS"));
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_MAX_CV_TEXT_CHARS;
  }
  return Math.min(10000, Math.round(configured));
}

function enabledTasks(): Set<"keyphrases" | "entities"> {
  const raw = env("AZURE_LANGUAGE_CV_TASKS");
  if (!raw) return new Set(["keyphrases"]);
  const tasks = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  return new Set(
    tasks.filter(
      (task): task is "keyphrases" | "entities" =>
        task === "keyphrases" || task === "entities",
    ),
  );
}

function isDisabled(): boolean {
  return env("AZURE_LANGUAGE_CV_ENABLED") === "0";
}

export function isAzureLanguageConfigured(): boolean {
  return Boolean(endpoint() && apiKey()) && !isDisabled();
}

function normalizeEndpoint(value: string): string {
  return value.replace(/\/+$/, "");
}

async function analyzeText(
  kind: AnalyzeKind,
  document: LanguageDocument,
): Promise<AnalyzeTextResponse> {
  const url = `${normalizeEndpoint(endpoint())}/language/:analyze-text?api-version=${encodeURIComponent(
    apiVersion(),
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": apiKey(),
    },
    body: JSON.stringify({
      kind,
      parameters: { modelVersion: "latest" },
      analysisInput: { documents: [document] },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Azure Language ${kind} failed: ${res.status} ${detail.slice(0, 240)}`,
    );
  }

  return (await res.json()) as AnalyzeTextResponse;
}

function uniq(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const cleaned = value.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= limit) break;
  }
  return out;
}

function parseKeyPhrases(response: AnalyzeTextResponse): {
  keyPhrases: string[];
  modelVersion?: string;
} {
  const doc = response.results?.documents?.[0] as
    | KeyPhraseDocumentResult
    | undefined;
  const phrases = Array.isArray(doc?.keyPhrases)
    ? doc.keyPhrases.map((phrase) => String(phrase ?? ""))
    : [];
  return {
    keyPhrases: uniq(phrases, 12),
    modelVersion: response.results?.modelVersion,
  };
}

function parseEntities(response: AnalyzeTextResponse): {
  entities: CvLanguageEntity[];
  modelVersion?: string;
} {
  const doc = response.results?.documents?.[0] as
    | EntityDocumentResult
    | undefined;
  const raw = Array.isArray(doc?.entities) ? doc.entities : [];
  const deduped = new Map<string, CvLanguageEntity>();
  for (const entity of raw) {
    const text = String(entity.text ?? "").trim();
    const category = String(entity.category ?? "").trim();
    if (!text || !category) continue;
    const key = `${text.toLowerCase()}:${category.toLowerCase()}`;
    if (deduped.has(key)) continue;
    const confidence =
      typeof entity.confidenceScore === "number"
        ? entity.confidenceScore
        : undefined;
    deduped.set(key, {
      text,
      category,
      type: entity.type ? String(entity.type).trim() : undefined,
      confidenceScore: confidence,
    });
    if (deduped.size >= 8) break;
  }
  return {
    entities: [...deduped.values()],
    modelVersion: response.results?.modelVersion,
  };
}

function pushLine(lines: string[], label: string, value: string | undefined) {
  const cleaned = value?.trim();
  if (cleaned) lines.push(`${label}: ${cleaned}`);
}

function parsedCvToCareerText(parsed: ParsedCv): string {
  const lines: string[] = [];
  pushLine(lines, "Ringkasan", parsed.personal.bio);
  pushLine(lines, "Lokasi", parsed.personal.location);
  if (parsed.skills.length > 0) {
    lines.push(`Skill: ${parsed.skills.map((s) => s.name).join(", ")}`);
  }
  for (const edu of parsed.education.slice(0, 4)) {
    lines.push(
      `Pendidikan: ${[edu.degree, edu.institution, edu.notes].filter(Boolean).join(", ")}`,
    );
  }
  for (const exp of parsed.experience.slice(0, 6)) {
    lines.push(
      `Pengalaman: ${[exp.position, exp.company, exp.duties].filter(Boolean).join(", ")}`,
    );
  }
  for (const org of parsed.organizations.slice(0, 4)) {
    lines.push(
      `Organisasi: ${[org.role, org.organization, org.duties].filter(Boolean).join(", ")}`,
    );
  }
  for (const project of parsed.projects.slice(0, 4)) {
    lines.push(
      `Proyek: ${[project.title, project.context, project.duties].filter(Boolean).join(", ")}`,
    );
  }
  return lines.join("\n");
}

export async function analyzeParsedCvWithLanguage(
  parsed: ParsedCv,
): Promise<CvLanguageInsights | undefined> {
  if (!isAzureLanguageConfigured()) return undefined;

  const rawText = parsedCvToCareerText(parsed);
  if (!rawText.trim()) return undefined;

  const maxChars = maxCvTextChars();
  const text = rawText.slice(0, maxChars);
  const document: LanguageDocument = {
    id: "cv",
    language: documentLanguage(),
    text,
  };
  const tasks = enabledTasks();
  if (tasks.size === 0) return undefined;

  const [keyPhraseResult, entityResult] = await Promise.all([
    tasks.has("keyphrases")
      ? analyzeText("KeyPhraseExtraction", document).then(parseKeyPhrases)
      : Promise.resolve({ keyPhrases: [] as string[], modelVersion: undefined }),
    tasks.has("entities")
      ? analyzeText("EntityRecognition", document).then(parseEntities)
      : Promise.resolve({
          entities: [] as CvLanguageEntity[],
          modelVersion: undefined,
        }),
  ]);

  if (
    keyPhraseResult.keyPhrases.length === 0 &&
    entityResult.entities.length === 0
  ) {
    return undefined;
  }

  return {
    keyPhrases: keyPhraseResult.keyPhrases,
    entities: entityResult.entities,
    modelVersion: keyPhraseResult.modelVersion ?? entityResult.modelVersion,
    analyzedAt: new Date().toISOString(),
    truncated: rawText.length > text.length,
  };
}

export function cvLanguageInsightNotes(
  insights: CvLanguageInsights | undefined,
): string[] {
  if (!insights) return [];
  const notes: string[] = [];
  if (insights.keyPhrases.length > 0) {
    notes.push(
      `Frasa utama CV: ${insights.keyPhrases.slice(0, 5).join(", ")}.`,
    );
  }
  if (insights.entities.length > 0) {
    const labels = insights.entities
      .slice(0, 4)
      .map((entity) => `${entity.text} (${entity.category})`);
    notes.push(`Entitas penting terdeteksi: ${labels.join(", ")}.`);
  }
  return notes;
}

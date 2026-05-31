import { skillById } from "./skills";

export type SkkniReference = {
  id: string;
  sourceTitle: string;
  sourceUrl?: string;
  standardNumber?: string;
  sector?: string;
  unitCode?: string;
  unitTitle: string;
  elementTitle?: string;
  kukNumber?: string;
  kukText: string;
  content: string;
  skillTags: string[];
};

const DEFAULT_API_VERSION = "2023-11-01";
const DEFAULT_INDEX = "skkni-v1";

const SKILL_TAG_ALIASES: Record<string, string[]> = {
  komunikasi: ["komunikasi", "communication", "komunikasi-kerja"],
  "customer-service": [
    "customer-service",
    "layanan-pelanggan-kantor",
    "communication",
  ],
  "data-literacy": ["data-literacy", "digital-literacy"],
  excel: ["excel", "spreadsheet"],
  "ms-office": ["ms-office", "word-processing", "spreadsheet"],
  "office-administration": [
    "office-administration",
    "administration",
    "clerical-skills",
  ],
  administration: ["administration", "office-administration"],
  "data-entry": ["data-entry", "clerical-skills"],
  "email-management": ["email-management", "digital-literacy"],
  marketing: ["marketing", "marketing-strategy"],
  sales: ["sales", "prospecting"],
  "digital-marketing": ["digital-marketing", "strategi-kampanye"],
  "content-marketing": ["content-marketing", "creative-content"],
  "social-media": ["social-media", "digital-communication"],
  copywriting: ["copywriting", "content-marketing"],
  "google-ads": ["google-ads", "sem", "strategi-kampanye"],
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function endpoint(): string {
  return (
    env("SKKNI_SEARCH_ENDPOINT") ||
    env("AZURE_SEARCH_SKKNI_ENDPOINT")
  ).replace(/\/+$/, "");
}

function key(): string {
  return (
    env("SKKNI_SEARCH_KEY") ||
    env("AZURE_SEARCH_SKKNI_KEY") ||
    env("AZURE_SEARCH_QUERY_KEY")
  );
}

function indexName(): string {
  return (
    env("SKKNI_SEARCH_INDEX") ||
    env("AZURE_SEARCH_INDEX_SKKNI") ||
    DEFAULT_INDEX
  );
}

function apiVersion(): string {
  return env("SKKNI_SEARCH_API_VERSION") || DEFAULT_API_VERSION;
}

function odataString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function skillTagsFor(skillId: string): string[] {
  const skillName = skillById[skillId]?.name;
  const nameSlug = skillName
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return Array.from(
    new Set([
      skillId,
      ...(nameSlug ? [nameSlug] : []),
      ...(SKILL_TAG_ALIASES[skillId] ?? []),
    ]),
  );
}

function tagsFilter(tags: string[]): string {
  return tags
    .map((tag) => `skillTags/any(t: t eq ${odataString(tag)})`)
    .join(" or ");
}

function normalizeReference(value: Record<string, unknown>): SkkniReference {
  return {
    id: String(value.id ?? ""),
    sourceTitle: String(value.sourceTitle ?? ""),
    sourceUrl: value.sourceUrl ? String(value.sourceUrl) : undefined,
    standardNumber: value.standardNumber
      ? String(value.standardNumber)
      : undefined,
    sector: value.sector ? String(value.sector) : undefined,
    unitCode: value.unitCode ? String(value.unitCode) : undefined,
    unitTitle: String(value.unitTitle ?? ""),
    elementTitle: value.elementTitle ? String(value.elementTitle) : undefined,
    kukNumber: value.kukNumber ? String(value.kukNumber) : undefined,
    kukText: String(value.kukText ?? ""),
    content: String(value.content ?? ""),
    skillTags: Array.isArray(value.skillTags)
      ? value.skillTags.map((tag) => String(tag))
      : [],
  };
}

export function isSkkniSearchConfigured(): boolean {
  return Boolean(endpoint() && key());
}

async function searchRaw(body: Record<string, unknown>) {
  const response = await fetch(
    `${endpoint()}/indexes/${encodeURIComponent(indexName())}/docs/search?api-version=${apiVersion()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": key(),
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`SKKNI Search gagal (${response.status}): ${message}`);
  }

  return (await response.json()) as { value?: Record<string, unknown>[] };
}

export async function searchSkkniReferences({
  skillId,
  query,
  top = 5,
}: {
  skillId?: string;
  query?: string;
  top?: number;
}): Promise<SkkniReference[]> {
  if (!isSkkniSearchConfigured()) return [];

  const skillName = skillId ? skillById[skillId]?.name : undefined;
  const searchText = [query, skillName, skillId].filter(Boolean).join(" ");
  const baseBody = {
    search: searchText || "*",
    top,
    queryType: "simple",
    searchMode: "any",
    searchFields: "content,kukText,unitTitle,elementTitle,sector,skillTags",
    select:
      "id,sourceTitle,sourceUrl,standardNumber,sector,unitCode,unitTitle,elementTitle,kukNumber,kukText,content,skillTags",
  };

  const tags = skillId ? skillTagsFor(skillId) : [];
  const attempts =
    tags.length > 0
      ? [{ ...baseBody, filter: tagsFilter(tags) }, baseBody]
      : [baseBody];

  for (const body of attempts) {
    try {
      const result = await searchRaw(body);
      const refs = (result.value ?? [])
        .map(normalizeReference)
        .filter((ref) => ref.id && ref.content);
      if (refs.length > 0) return refs;
    } catch (err) {
      console.warn("[skkni-search] query failed:", err);
      return [];
    }
  }

  return [];
}

export function formatSkkniReferences(references: SkkniReference[]): string {
  if (references.length === 0) {
    return "Tidak ada referensi SKKNI yang ditemukan.";
  }

  return references
    .map((ref, index) => {
      const kuk = [ref.kukNumber, ref.kukText].filter(Boolean).join(" ");
      return [
        `${index + 1}. ${ref.unitCode ?? "Unit"} - ${ref.unitTitle}`,
        ref.elementTitle ? `Elemen: ${ref.elementTitle}` : null,
        kuk ? `KUK: ${kuk}` : null,
        ref.sourceTitle ? `Sumber: ${ref.sourceTitle}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

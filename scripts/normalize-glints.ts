import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Job, JobType, SkillRequirement, WorkMode } from "../lib/types";

const RAW_IN = resolve(process.cwd(), "data/glints-jobs.json");
const OUT = resolve(process.cwd(), "data/akselerja-jobs.json");

type RawJob = {
  uuid: string;
  slug: string;
  url: string;
  title: string | null;
  description: string | null;
  datePosted: string | null;
  validThrough: string | null;
  employmentType: string | null;
  directApply: boolean | null;
  industry: string | null;
  occupationalCategory: string | null;
  jobBenefits: string | null;
  educationCategory: string | null;
  companyName: string | null;
  companyLogo: string | null;
  companyWebsite: string | null;
  companyOverview: string | null;
  companySize?: string | null;
  companyStatus?: string | null;
  companyInstagramUrl?: string | null;
  companyFacebookUrl?: string | null;
  companyLinkedInUrl?: string | null;
  industryBreadcrumb?: string[];
  officeAddress?: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  salaries?: {
    salaryType: string;
    salaryMode: string;
    minAmount: number;
    maxAmount: number;
    currency: string;
  }[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryUnit: string | null;
  skills: { name: string; mustHave: boolean }[];
  workArrangement: string | null;
  educationLevel?: string | null;
  minYearsOfExperience?: number | null;
  maxYearsOfExperience?: number | null;
  scrapedAt: string;
};

const TAXONOMY_ALIASES: Record<string, string> = {
  "microsoft-excel": "excel",
  "ms-excel": "excel",
  excel: "excel",
  "warehouse-management": "wms",
  "warehouse-management-system": "wms",
  wms: "wms",
  "inventory-management": "inventory",
  inventory: "inventory",
  "manajemen-inventaris": "inventory",
  "manajemen-stok": "inventory",
  "stock-management": "inventory",
  "customer-service": "customer-service",
  "customer-support": "customer-service",
  "layanan-pelanggan": "customer-service",
  komunikasi: "komunikasi",
  communication: "komunikasi",
  "communication-skills": "komunikasi",
  communicative: "komunikasi",
  sql: "sql",
  "power-bi": "powerbi",
  powerbi: "powerbi",
  "data-literacy": "data-literacy",
  "literasi-data": "data-literacy",
  sales: "sales",
  penjualan: "sales",
  "sales-strategy": "sales",
  "sales-and-marketing": "sales",
  "b2b-sales": "sales",
  "b2c-sales": "sales",
  "sales-management": "sales",
  manufacturing: "manufacturing-basics",
  manufaktur: "manufacturing-basics",
  "problem-solving": "problem-solving",
  "pemecahan-masalah": "problem-solving",
  ketelitian: "ketelitian",
  "attention-to-detail": "ketelitian",
  "email-management": "email-management",
  "manajemen-email": "email-management",
  bookkeeping: "bookkeeping",
  pembukuan: "bookkeeping",
  "visual-hierarchy": "visual-hierarchy",
  "laporan-stok": "laporan-stok",
  "stock-report": "laporan-stok",
  "sap-inventory": "sap-inventory",
  sap: "sap-inventory",
  "microsoft-office": "ms-office",
  "ms-office": "ms-office",
  "office-suite": "ms-office",
  "microsoft-word": "ms-office",
  "microsoft-outlook": "ms-office",
  "google-sheets": "google-workspace",
  "google-docs": "google-workspace",
  "google-workspace": "google-workspace",
  teamwork: "teamwork",
  "team-work": "teamwork",
  "kerja-sama": "teamwork",
  "kerja-sama-tim": "teamwork",
  collaboration: "teamwork",
  "team-leadership": "leadership",
  leadership: "leadership",
  kepemimpinan: "leadership",
  "time-management": "time-management",
  "manajemen-waktu": "time-management",
  "organizational-skills": "time-management",
  english: "english",
  "english-language": "english",
  "bahasa-inggris": "english",
  "public-speaking": "public-speaking",
  negotiation: "negotiation",
  "negotiation-skills": "negotiation",
  negosiasi: "negotiation",
  marketing: "marketing",
  "marketing-strategy": "marketing",
  "marketing-communications": "marketing",
  "marketing-management": "marketing",
  "b2b-marketing": "marketing",
  "market-research": "marketing",
  "digital-marketing": "digital-marketing",
  "content-marketing": "content-marketing",
  "content-strategy": "content-marketing",
  "content-planning": "content-marketing",
  "content-operations": "content-marketing",
  "social-media": "social-media",
  "social-media-management": "social-media",
  "instagram-marketing": "social-media",
  tiktok: "social-media",
  "affiliate-marketing": "social-media",
  "content-writing": "content-writing",
  "creative-writing": "content-writing",
  "content-editing": "content-writing",
  copywriting: "copywriting",
  seo: "seo",
  "google-ads": "google-ads",
  "google-analytics": "google-ads",
  "graphic-design": "graphic-design",
  "image-editing": "graphic-design",
  canva: "canva",
  "canva-design": "canva",
  "adobe-photoshop": "adobe-photoshop",
  photoshop: "adobe-photoshop",
  "adobe-illustrator": "adobe-photoshop",
  "video-editing": "video-editing",
  "customer-relations": "customer-relationship",
  "customer-relationship-management": "customer-relationship",
  crm: "customer-relationship",
  telemarketing: "telemarketing",
  cashier: "cashier",
  kasir: "cashier",
  "restaurant-reception": "cashier",
  accounting: "accounting",
  akuntansi: "accounting",
  "tax-accounting": "tax",
  "tax-reporting": "tax",
  "tax-compliance": "tax",
  perpajakan: "tax",
  "financial-analysis": "financial-analysis",
  "analisis-keuangan": "financial-analysis",
  administration: "administration",
  administrasi: "administration",
  "office-administration": "office-administration",
  "data-entry": "data-entry",
  "data-analysis": "data-analysis",
  "analisis-data": "data-analysis",
  "analytical-skills": "data-analysis",
  logistics: "logistics",
  "logistics-management": "logistics",
  logistik: "logistics",
  "stock-opname": "stock-opname",
  "equipment-maintenance": "maintenance",
  "maintenance-engineering": "maintenance",
  "electrical-maintenance": "maintenance",
  teaching: "teaching",
  mengajar: "teaching",
  "language-teaching": "teaching",
  "lesson-planning": "lesson-planning",
  "classroom-management": "classroom-management",
  "student-counseling": "classroom-management",
  recruitment: "recruitment",
  rekrutmen: "recruitment",
  "human-resource-development-hrd": "hr-development",
  "hris-database-management": "hr-development",
  cook: "cooking",
  cooking: "cooking",
  memasak: "cooking",
  baking: "baking",
  "food-decoration": "food-decoration",
  autocad: "autocad",
  sketchup: "sketchup",
};

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function slugifyCompany(name: string): string {
  return (
    name
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "unknown"
  );
}

function mapJobType(raw: string | null): JobType {
  const v = (raw ?? "").toUpperCase();
  if (v === "PART_TIME" || v === "PART-TIME" || v === "PARTTIME") return "Part-time";
  if (v === "CONTRACT" || v === "CONTRACTOR" || v === "TEMPORARY") return "Kontrak";
  if (v === "INTERNSHIP" || v === "INTERN") return "Magang";
  return "Full-time";
}

function mapWorkMode(raw: string | null): WorkMode {
  const v = (raw ?? "").toUpperCase();
  if (v === "REMOTE" || v === "WORK_FROM_HOME") return "remote";
  if (v === "HYBRID") return "hybrid";
  return "onsite";
}

function decodeMojibake(s: string): string {
  // Glints sends UTF-8 bytes through what looks like a Latin-1 pipe. Roundtrip
  // via Latin-1 to recover the original UTF-8 (e.g., "ðŸš€" -> "🚀").
  try {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (/Ã.|â€|ðŸ/.test(s) && !/Ã.|â€|ðŸ/.test(decoded)) return decoded;
    return s;
  } catch {
    return s;
  }
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
};

function decodeEntities(s: string): string {
  let out = s.replace(/&(amp|lt|gt|quot|apos|nbsp|hellip|mdash|ndash|#39);/g, (m) => HTML_ENTITIES[m] ?? m);
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanDescription(html: string | null): string {
  if (!html) return "";
  return stripHtml(decodeEntities(decodeMojibake(html)));
}

function buildRequirements(
  skills: { name: string; mustHave: boolean }[],
): SkillRequirement[] {
  const matched = new Map<
    string,
    { required: 1 | 2 | 3; name: string }
  >();
  for (const s of skills) {
    const trimmed = s.name?.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);
    if (!slug) continue;
    const id = TAXONOMY_ALIASES[slug] ?? slug;
    const required: 1 | 2 | 3 = s.mustHave ? 2 : 1;
    const existing = matched.get(id);
    if (!existing || (existing.required as number) < required) {
      matched.set(id, { required, name: existing?.name ?? trimmed });
    }
  }
  if (matched.size === 0) return [];
  const w = 1 / matched.size;
  return [...matched.entries()].map(([skillId, v]) => ({
    skillId,
    required: v.required,
    weight: w,
    name: v.name,
  }));
}

function deriveLocation(raw: RawJob): string {
  const parts: string[] = [];
  if (raw.city) parts.push(raw.city);
  if (raw.region && raw.region !== raw.city) parts.push(raw.region);
  return parts.length === 0 ? "Indonesia" : parts.join(", ");
}

function combineDescription(raw: RawJob): string {
  return cleanDescription(raw.description);
}

function pickSalary(raw: RawJob): { min: number; max: number } {
  const entries = raw.salaries ?? [];
  const basic = entries.find((s) => s.salaryType === "BASIC");
  if (basic) return { min: basic.minAmount, max: basic.maxAmount };
  if (entries.length > 0) {
    const top = entries.reduce(
      (best, cur) => (cur.maxAmount > best.maxAmount ? cur : best),
      entries[0],
    );
    return { min: top.minAmount, max: top.maxAmount };
  }
  return { min: raw.salaryMin ?? 0, max: raw.salaryMax ?? 0 };
}

function pickBonus(raw: RawJob): { min: number; max: number } | null {
  const bonus = (raw.salaries ?? []).find((s) => s.salaryType === "BONUS");
  if (!bonus) return null;
  return { min: bonus.minAmount, max: bonus.maxAmount };
}

function deriveIndustry(raw: RawJob): string {
  if (raw.industryBreadcrumb && raw.industryBreadcrumb.length > 0) {
    return raw.industryBreadcrumb[raw.industryBreadcrumb.length - 1];
  }
  return raw.industry ?? raw.occupationalCategory ?? "Lainnya";
}

function normalize(raw: RawJob): Job | null {
  if (!raw.title || !raw.companyName) return null;
  const company = raw.companyName;
  const companyId = slugifyCompany(company);
  const now = Date.now();
  const validUntil = raw.validThrough ? new Date(raw.validThrough).getTime() : null;
  const status: "open" | "closed" =
    validUntil && validUntil < now ? "closed" : "open";
  const { min, max } = pickSalary(raw);
  const bonus = pickBonus(raw);

  return {
    id: raw.uuid,
    title: raw.title,
    company,
    companyId,
    companyLogo: raw.companyLogo ?? undefined,
    companyVerified: raw.companyStatus === "VERIFIED" ? true : undefined,
    companySize: raw.companySize ?? undefined,
    companyOverview: raw.companyOverview
      ? cleanDescription(raw.companyOverview) || undefined
      : undefined,
    companyWebsite: raw.companyWebsite ?? undefined,
    companyInstagramUrl: raw.companyInstagramUrl ?? undefined,
    companyFacebookUrl: raw.companyFacebookUrl ?? undefined,
    companyLinkedInUrl: raw.companyLinkedInUrl ?? undefined,
    industryBreadcrumb:
      raw.industryBreadcrumb && raw.industryBreadcrumb.length > 0
        ? raw.industryBreadcrumb
        : undefined,
    officeAddress: raw.officeAddress ?? undefined,
    location: deriveLocation(raw),
    salaryMin: min,
    salaryMax: max,
    bonusMin: bonus?.min,
    bonusMax: bonus?.max,
    type: mapJobType(raw.employmentType),
    industry: deriveIndustry(raw),
    workMode: mapWorkMode(raw.workArrangement),
    description: combineDescription(raw),
    requirements: buildRequirements(raw.skills),
    postedAt: raw.datePosted ?? raw.scrapedAt,
    status,
    closedAt: status === "closed" && raw.validThrough ? raw.validThrough : undefined,
    applyUrl: raw.url,
    minEducation: raw.educationLevel ?? raw.educationCategory ?? undefined,
    minExperienceYears: raw.minYearsOfExperience ?? undefined,
    maxExperienceYears: raw.maxYearsOfExperience ?? undefined,
    benefits: raw.jobBenefits
      ? raw.jobBenefits
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
      : undefined,
  };
}

async function main() {
  const buf = await readFile(RAW_IN, "utf8");
  const rawJobs: RawJob[] = JSON.parse(buf);
  console.log(`[normalize] loaded ${rawJobs.length} raw jobs`);

  const jobs: Job[] = [];
  let skipped = 0;
  let withMatchedSkills = 0;
  let withSalary = 0;
  for (const r of rawJobs) {
    const j = normalize(r);
    if (!j) {
      skipped++;
      continue;
    }
    if (j.requirements.length > 0) withMatchedSkills++;
    if (j.salaryMax > 0) withSalary++;
    jobs.push(j);
  }

  await writeFile(OUT, JSON.stringify(jobs, null, 2), "utf8");

  const taxonomyHits = new Map<string, number>();
  for (const j of jobs) {
    for (const r of j.requirements) {
      taxonomyHits.set(r.skillId, (taxonomyHits.get(r.skillId) ?? 0) + 1);
    }
  }
  console.log(`[normalize] wrote ${jobs.length} jobs (skipped ${skipped}) -> ${OUT}`);
  console.log(`[normalize] ${withMatchedSkills}/${jobs.length} jobs have at least 1 taxonomy-matched skill`);
  console.log(`[normalize] ${withSalary}/${jobs.length} jobs have disclosed salary`);
  const topHits = [...taxonomyHits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  console.log(`[normalize] top skill ids: ${topHits.map(([k, v]) => `${k}=${v}`).join(", ")}`);
  const allSkillNames = new Map<string, number>();
  for (const j of jobs) {
    for (const r of j.requirements) {
      const display = r.name ?? r.skillId;
      allSkillNames.set(display, (allSkillNames.get(display) ?? 0) + 1);
    }
  }
  console.log(`[normalize] unique skill names: ${allSkillNames.size}`);
  const topNames = [...allSkillNames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log(`[normalize] top 15 skill names:`);
  for (const [k, v] of topNames) console.log(`   ${v.toString().padStart(4)} ${k}`);
  const openCount = jobs.filter((j) => j.status === "open").length;
  console.log(`[normalize] status: open=${openCount} closed=${jobs.length - openCount}`);
}

main().catch((err) => {
  console.error("\nnormalize failed:", err);
  process.exit(1);
});

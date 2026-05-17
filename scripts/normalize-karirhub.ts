import { readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import type { Job, JobType, SkillRequirement, WorkMode } from "../lib/types";
import { skills as taxonomySkills } from "../lib/skills";

const RAW_IN = resolve(process.cwd(), "data/karirhub-jobs.json");
const COMPANY_NAMES_IN = resolve(process.cwd(), "data/company-names.json");
const OUT = resolve(process.cwd(), "data/akselerja-jobs.json");

type RawJob = {
  uuid: string;
  slug: string;
  url: string;
  title: string;
  location: string | null;
  postedRelative: string | null;
  applyDeadline: string | null;
  jobField: string | null;
  jobType: string | null;
  workType: string | null;
  genderPreference: string | null;
  salaryRange: string | null;
  description: string | null;
  requirements: string | null;
  minEducation: string | null;
  maritalStatus: string | null;
  minExperience: string | null;
  physicalCondition: string | null;
  skills: string[];
  companyName: string | null;
  companyAbout: string | null;
  companyIndustry: string | null;
  source: string | null;
  scrapedAt: string;
};

const TAXONOMY_ALIASES: Record<string, string> = {
  // --- Original 17 (preserved) ---
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

  // --- Office productivity ---
  "microsoft-office": "ms-office",
  "ms-office": "ms-office",
  "office-suite": "ms-office",
  "microsoft-word": "ms-office",
  "microsoft-outlook": "ms-office",
  "google-sheets": "google-workspace",
  "google-docs": "google-workspace",
  "google-workspace": "google-workspace",

  // --- Soft skills ---
  teamwork: "teamwork",
  "team-work": "teamwork",
  "kerja-sama": "teamwork",
  "kerja-sama-tim": "teamwork",
  collaboration: "teamwork",
  leadership: "leadership",
  kepemimpinan: "leadership",
  "time-management": "time-management",
  "manajemen-waktu": "time-management",
  "organizational-skills": "time-management",
  english: "english",
  "english-language": "english",
  "bahasa-inggris": "english",
  "public-speaking": "public-speaking",

  // --- Sales/marketing/content/design ---
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

  // --- Customer-facing ---
  "customer-relations": "customer-relationship",
  "customer-relationship-management": "customer-relationship",
  crm: "customer-relationship",
  telemarketing: "telemarketing",
  cashier: "cashier",
  kasir: "cashier",
  "restaurant-reception": "cashier",

  // --- Finance, admin ---
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

  // --- Data ---
  "data-analysis": "data-analysis",
  "analisis-data": "data-analysis",
  "analytical-skills": "data-analysis",

  // --- Logistics ---
  logistics: "logistics",
  "logistics-management": "logistics",
  logistik: "logistics",
  "stock-opname": "stock-opname",
  "equipment-maintenance": "maintenance",
  "maintenance-engineering": "maintenance",
  "electrical-maintenance": "maintenance",

  // --- Education ---
  teaching: "teaching",
  mengajar: "teaching",
  "language-teaching": "teaching",
  "lesson-planning": "lesson-planning",
  "classroom-management": "classroom-management",
  "student-counseling": "classroom-management",

  // --- HR ---
  recruitment: "recruitment",
  rekrutmen: "recruitment",
  "human-resource-development-hrd": "hr-development",
  "hris-database-management": "hr-development",

  // --- Food & hospitality ---
  cook: "cooking",
  cooking: "cooking",
  memasak: "cooking",
  baking: "baking",
  "food-decoration": "food-decoration",

  // --- Design tools ---
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

function parseSalary(range: string | null): { min: number; max: number } {
  if (!range) return { min: 0, max: 0 };
  if (/dirahasiakan|negotiable|nego/i.test(range)) return { min: 0, max: 0 };
  const numbers = range
    .replace(/Rp\.?/gi, "")
    .match(/[\d.]+/g)
    ?.map((n) => parseInt(n.replace(/\./g, ""), 10))
    .filter((n) => !isNaN(n) && n >= 100_000) ?? [];
  if (numbers.length === 0) return { min: 0, max: 0 };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

function mapJobType(raw: string | null): JobType {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("part")) return "Part-time";
  if (v.includes("contract") || v.includes("kontrak")) return "Kontrak";
  if (v.includes("intern") || v.includes("magang")) return "Magang";
  return "Full-time";
}

function mapWorkMode(raw: string | null, location: string | null): WorkMode {
  const text = `${raw ?? ""} ${location ?? ""}`.toLowerCase();
  if (text.includes("remote")) return "remote";
  if (text.includes("hybrid")) return "hybrid";
  return "onsite";
}

function cleanLocation(loc: string | null): string {
  if (!loc) return "Indonesia";
  return loc.replace(/,\s*Indonesia\s*$/i, "").trim() || loc;
}

const ID_MONTHS: Record<string, number> = {
  jan: 0, januari: 0,
  feb: 1, februari: 1,
  mar: 2, maret: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5,
  jul: 6, juli: 6,
  agu: 7, agustus: 7, aug: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9, oct: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11,
};

function parseDeadline(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = ID_MONTHS[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  if (month === undefined) return null;
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString();
}

function parsePostedAt(rel: string | null, scrapedAt: string): string {
  if (!rel) return scrapedAt;
  const lower = rel.toLowerCase();
  const num = lower.match(/(\d+)/)?.[1];
  const n = num ? parseInt(num, 10) : 1;
  const scrapedMs = new Date(scrapedAt).getTime();
  let offset = 0;
  if (lower.includes("menit")) offset = n * 60_000;
  else if (lower.includes("jam")) offset = n * 3_600_000;
  else if (lower.includes("hari")) offset = n * 86_400_000;
  else if (lower.includes("bulan")) offset = n * 30 * 86_400_000;
  else return scrapedAt;
  return new Date(scrapedMs - offset).toISOString();
}

function inferSkillId(rawName: string): string | null {
  const slug = slugify(rawName);
  return TAXONOMY_ALIASES[slug] ?? null;
}

function buildRequirements(rawSkills: string[]): SkillRequirement[] {
  const matched: SkillRequirement[] = [];
  const seen = new Set<string>();
  for (const raw of rawSkills) {
    const id = inferSkillId(raw);
    if (id && !seen.has(id)) {
      seen.add(id);
      matched.push({ skillId: id, required: 2, weight: 0 });
    }
  }
  if (matched.length === 0) return [];
  const w = 1 / matched.length;
  return matched.map((r) => ({ ...r, weight: w }));
}

function deriveCompanyName(raw: RawJob, geminiMap: Record<string, string | null>): string | null {
  // Prefer Gemini-extracted name (high quality), fall back to regex.
  const gemini = geminiMap[raw.uuid];
  if (gemini && gemini.length >= 2) return gemini;
  if (raw.companyName) return raw.companyName;
  const about = raw.companyAbout?.trim();
  if (!about) return null;

  const firstLine = about.split(/\n/)[0];
  const firstSentence =
    firstLine.length < 220
      ? firstLine
      : firstLine.split(/(?<=\.|\?|!)\s/)[0] ?? firstLine;
  const candidates: string[] = [];

  const legalRe =
    /\b(PT\.?|CV\.?|UD\.?|Yayasan|PD\.?|Koperasi|LSP|Lembaga\s+Sertifikasi\s+Profesi)\s+([A-Z][A-Za-z0-9'&\.\-]+(?:\s+[A-Z][A-Za-z0-9'&\.\-]+){0,5})/;
  const legal = about.match(legalRe);
  if (legal) candidates.push(`${legal[1].replace(/\.$/, "")} ${legal[2]}`.trim());

  // Brand suffix: stop the capture exactly at the suffix word; reject if a
  // verb-like trailing token follows (e.g. "TPM Group evolved into ...").
  const groupRe =
    /\b([A-Z][A-Za-z0-9'&]+(?:\s+[A-Z][A-Za-z0-9'&]+){0,3}\s+(?:Group|Indonesia|Holdings?|Capital|Inc|Co|Corporation|Tbk))\b(?!\s*(?:evolved|integrated|continues|is|are|was|adalah))/;
  const group = firstSentence.match(groupRe);
  if (group) candidates.push(group[1]);

  const yearRe =
    /(?:tahun\s+\d{4}|Founded\s+(?:in\s+)?\d{4}|Established\s+(?:since\s+|in\s+)?\d{4}|Berdiri\s+(?:pada\s+)?(?:tahun\s+)?\d{4})[,\s]+([A-Z][A-Za-z0-9'&\.\-]+(?:\s+[A-Z][A-Za-z0-9'&\.\-]+){0,4})/i;
  const year = firstSentence.match(yearRe);
  if (year) candidates.push(year[1].trim());

  const capsRe = /^([A-Z][A-Z0-9]{2,}(?:\s+[A-Z][A-Z0-9]+){0,3})\s+[a-z]/;
  const caps = firstSentence.match(capsRe);
  if (caps) candidates.push(caps[1].trim());

  // Standalone short brand at sentence start ("Memorable Inc.", "Teazzi",
  // "Suasanakopi"). Only triggers on short lines to avoid false positives.
  if (firstSentence.length < 80) {
    const standaloneRe = /^([A-Z][A-Za-z0-9'&\.\-]+(?:\s+[A-Z][A-Za-z0-9'&\.\-]+){0,2})(?:\s*[\.,!]|\s*$)/;
    const standalone = firstSentence.match(standaloneRe);
    if (standalone) candidates.push(standalone[1].trim());
  }

  const verbBlacklist = /\b(evolved|integrated|continues|adalah|merupakan|telah|bergerak|menyediakan|memiliki)\b/i;
  const startBlacklist = new Set([
    "kami", "we", "our", "the", "berdiri", "didirikan", "founded", "established",
    "sejak", "since", "as", "perusahaan", "lembaga", "tertempa", "saat", "ini",
    "menyediakan", "memiliki", "in", "at", "of", "for", "and", "with",
  ]);

  const filtered = candidates
    .map((c) => c.replace(/[\s,.;:]+$/g, "").trim())
    .filter((c) => {
      if (c.length < 3 || c.length > 80) return false;
      if (verbBlacklist.test(c)) return false;
      const first = c.split(/\s+/)[0].toLowerCase();
      if (startBlacklist.has(first)) return false;
      return true;
    });

  if (filtered.length === 0) return null;
  filtered.sort((a, b) => {
    const aLegal = /^(PT|CV|UD|Yayasan|PD|Koperasi|LSP|Lembaga)\b/.test(a) ? 1 : 0;
    const bLegal = /^(PT|CV|UD|Yayasan|PD|Koperasi|LSP|Lembaga)\b/.test(b) ? 1 : 0;
    if (aLegal !== bLegal) return bLegal - aLegal;
    return b.length - a.length;
  });
  return filtered[0];
}

function combineDescription(raw: RawJob): string {
  const parts: string[] = [];
  if (raw.description && raw.description !== raw.title) parts.push(raw.description);
  if (raw.requirements) parts.push(`Kualifikasi:\n${raw.requirements}`);
  if (raw.companyAbout) parts.push(`Tentang perusahaan:\n${raw.companyAbout}`);
  return parts.join("\n\n").trim();
}

function normalize(raw: RawJob, geminiMap: Record<string, string | null>): Job | null {
  if (!raw.title) return null;
  const extracted = deriveCompanyName(raw, geminiMap);
  const company = extracted ?? (raw.jobField ? `Perusahaan ${raw.jobField}` : "Perusahaan");
  const companyId = slugifyCompany(company);
  const { min, max } = parseSalary(raw.salaryRange);
  const deadline = parseDeadline(raw.applyDeadline);
  const now = Date.now();
  const status: "open" | "closed" =
    deadline && new Date(deadline).getTime() < now ? "closed" : "open";

  return {
    id: raw.uuid,
    title: raw.title,
    company,
    companyId,
    location: cleanLocation(raw.location),
    salaryMin: min,
    salaryMax: max,
    type: mapJobType(raw.jobType),
    industry: raw.jobField ?? "Lainnya",
    workMode: mapWorkMode(raw.workType, raw.location),
    description: combineDescription(raw),
    requirements: buildRequirements(raw.skills),
    postedAt: parsePostedAt(raw.postedRelative, raw.scrapedAt),
    status,
    closedAt: status === "closed" && deadline ? deadline : undefined,
  };
}

async function main() {
  const buf = await readFile(RAW_IN, "utf8");
  const rawJobs: RawJob[] = JSON.parse(buf);
  console.log(`[normalize] loaded ${rawJobs.length} raw jobs`);

  let geminiMap: Record<string, string | null> = {};
  try {
    await access(COMPANY_NAMES_IN);
    geminiMap = JSON.parse(await readFile(COMPANY_NAMES_IN, "utf8"));
    const hits = Object.values(geminiMap).filter(Boolean).length;
    console.log(`[normalize] loaded ${hits} Gemini-extracted company names`);
  } catch {
    console.log(`[normalize] no Gemini cache at ${COMPANY_NAMES_IN}, using regex only`);
  }

  const jobs: Job[] = [];
  let skipped = 0;
  let withMatchedSkills = 0;
  for (const r of rawJobs) {
    const j = normalize(r, geminiMap);
    if (!j) {
      skipped++;
      continue;
    }
    if (j.requirements.length > 0) withMatchedSkills++;
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
  console.log(`[normalize] taxonomy coverage:`);
  for (const s of taxonomySkills) {
    console.log(`   ${s.id.padEnd(22)} ${taxonomyHits.get(s.id) ?? 0}`);
  }
  const openCount = jobs.filter((j) => j.status === "open").length;
  console.log(`[normalize] status: open=${openCount} closed=${jobs.length - openCount}`);
  const withSalary = jobs.filter((j) => j.salaryMax > 0).length;
  console.log(`[normalize] salary disclosed: ${withSalary}/${jobs.length}`);
  const cities = new Map<string, number>();
  for (const j of jobs) {
    const city = j.location.split(",")[0].trim();
    cities.set(city, (cities.get(city) ?? 0) + 1);
  }
  const topCities = [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`[normalize] top 10 cities:`, topCities.map(([c, n]) => `${c}=${n}`).join(", "));
}

main().catch((err) => {
  console.error("\nnormalize failed:", err);
  process.exit(1);
});

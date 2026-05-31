import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const DELAY_MS = 2000;
const MAX_RETRIES = 3;

const DATA_DIR = resolve(process.cwd(), "data");
const CACHE_DIR = join(DATA_DIR, "glints-cache", "detail");
const INDEX_IN = join(DATA_DIR, "glints-index.json");
const OUT = join(DATA_DIR, "glints-jobs.json");

type IndexEntry = { slug: string; uuid: string; href: string };

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
  companySize: string | null;
  companyStatus: string | null;
  companyInstagramUrl: string | null;
  companyFacebookUrl: string | null;
  companyLinkedInUrl: string | null;
  industryBreadcrumb: string[];
  officeAddress: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  salaries: {
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
  educationLevel: string | null;
  minYearsOfExperience: number | null;
  maxYearsOfExperience: number | null;
  scrapedAt: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function curlFetch(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolveP, rejectP) => {
    const args = [
      "-sS",
      "--compressed",
      "-A",
      UA,
      "-H",
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "-H",
      "Accept-Language: id-ID,id;q=0.9,en;q=0.8",
      "-w",
      "\n__HTTP_STATUS__:%{http_code}",
      url,
    ];
    const child = spawn("curl", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", rejectP);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectP(new Error(`curl exit ${code}: ${err}`));
        return;
      }
      const m = out.match(/\n__HTTP_STATUS__:(\d+)$/);
      const status = m ? parseInt(m[1], 10) : 0;
      const body = m ? out.slice(0, -m[0].length) : out;
      resolveP({ status, body });
    });
  });
}

async function fetchHtml(url: string, cachePath: string): Promise<string> {
  if (await fileExists(cachePath)) {
    return readFile(cachePath, "utf8");
  }
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { status, body } = await curlFetch(url);
      if (status === 429 || status === 503) {
        const wait = DELAY_MS * Math.pow(2, attempt);
        console.warn(`  ${status} on ${url}, backing off ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (status < 200 || status >= 300) {
        throw new Error(`HTTP ${status}`);
      }
      await writeFile(cachePath, body, "utf8");
      return body;
    } catch (err) {
      lastErr = err;
      console.warn(`  attempt ${attempt} failed: ${String(err).slice(0, 120)}`);
      await sleep(DELAY_MS * attempt);
    }
  }
  throw lastErr ?? new Error(`Failed: ${url}`);
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1]);
      if (data && (data["@type"] === "JobPosting" || data.type === "JobPosting")) {
        return data;
      }
    } catch {
    }
  }
  return null;
}

function extractNextData(html: string): unknown {
  const m = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/,
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function findJobSkills(nextData: unknown): { name: string; mustHave: boolean }[] {
  const seen = new WeakSet<object>();
  const found: { name: string; mustHave: boolean }[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.JobSkills)) {
      for (const js of obj.JobSkills) {
        if (js && typeof js === "object") {
          const s = js as { mustHave?: boolean; skill?: { name?: string } };
          const name = s.skill?.name?.trim();
          if (name && !found.some((f) => f.name === name)) {
            found.push({ name, mustHave: Boolean(s.mustHave) });
          }
        }
      }
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }
  walk(nextData);
  return found;
}

function findSalaries(nextData: unknown): RawJob["salaries"] {
  const seen = new WeakSet<object>();
  const found: RawJob["salaries"] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.salaries)) {
      for (const s of obj.salaries) {
        if (!s || typeof s !== "object") continue;
        const sal = s as {
          salaryType?: string;
          salaryMode?: string;
          minAmount?: number;
          maxAmount?: number;
          CurrencyCode?: string;
          currency?: string;
        };
        if (
          typeof sal.minAmount === "number" &&
          typeof sal.maxAmount === "number" &&
          typeof sal.salaryType === "string"
        ) {
          if (
            !found.some(
              (f) =>
                f.salaryType === sal.salaryType &&
                f.minAmount === sal.minAmount &&
                f.maxAmount === sal.maxAmount,
            )
          ) {
            found.push({
              salaryType: sal.salaryType,
              salaryMode: sal.salaryMode ?? "MONTH",
              minAmount: sal.minAmount,
              maxAmount: sal.maxAmount,
              currency: sal.CurrencyCode ?? sal.currency ?? "IDR",
            });
          }
        }
      }
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }
  walk(nextData);
  return found;
}

function findCompanyFromNextData(
  nextData: unknown,
): {
  size: string | null;
  status: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedInUrl: string | null;
} {
  const seen = new WeakSet<object>();
  let result = {
    size: null as string | null,
    status: null as string | null,
    websiteUrl: null as string | null,
    facebookUrl: null as string | null,
    instagramUrl: null as string | null,
    linkedInUrl: null as string | null,
  };
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    // A `company` object on the job has keys like name + logo + size + status.
    if (
      typeof obj.name === "string" &&
      typeof obj.logo === "string" &&
      ("size" in obj || "status" in obj)
    ) {
      if (typeof obj.size === "string" && !result.size) result.size = obj.size;
      if (typeof obj.status === "string" && !result.status) result.status = obj.status;
      if (typeof obj.website === "string" && obj.website && !result.websiteUrl) {
        result.websiteUrl = obj.website;
      }
      if (typeof obj.websiteUrl === "string" && !result.websiteUrl) {
        result.websiteUrl = obj.websiteUrl;
      }
      if (
        typeof obj.socialMediaSitesJsonString === "string" &&
        obj.socialMediaSitesJsonString
      ) {
        const handles = parseSocialHandles(obj.socialMediaSitesJsonString);
        if (handles.instagram && !result.instagramUrl) {
          result.instagramUrl = `https://www.instagram.com/${stripAt(handles.instagram)}`;
        }
        if (handles.facebook && !result.facebookUrl) {
          result.facebookUrl = facebookUrlFromHandle(handles.facebook);
        }
        if (handles.linkedin && !result.linkedInUrl) {
          result.linkedInUrl = linkedInUrlFromHandle(handles.linkedin);
        }
      }
      if (typeof obj.facebookUrl === "string" && !result.facebookUrl) result.facebookUrl = obj.facebookUrl;
      if (typeof obj.instagramUrl === "string" && !result.instagramUrl) result.instagramUrl = obj.instagramUrl;
      if (typeof obj.linkedInUrl === "string" && !result.linkedInUrl) result.linkedInUrl = obj.linkedInUrl;
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }
  walk(nextData);
  return result;
}

function parseSocialHandles(json: string): {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
} {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const out: { instagram?: string; facebook?: string; linkedin?: string; twitter?: string } = {};
    for (const k of ["instagram", "facebook", "linkedin", "twitter"] as const) {
      const v = parsed[k];
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function stripAt(handle: string): string {
  return handle.replace(/^@/, "").replace(/\s+/g, "");
}

function facebookUrlFromHandle(h: string): string {
  const trimmed = h.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://www.facebook.com/${trimmed.replace(/\s+/g, "")}`;
}

function linkedInUrlFromHandle(h: string): string {
  const trimmed = h.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("in/") || trimmed.startsWith("company/")) {
    return `https://www.linkedin.com/${trimmed}`;
  }
  return `https://www.linkedin.com/company/${trimmed.replace(/\s+/g, "-")}`;
}

function findIndustryBreadcrumb(nextData: unknown): string[] {
  const seen = new WeakSet<object>();
  let result: string[] = [];
  function walk(node: unknown) {
    if (result.length > 0) return;
    if (!node || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (
      typeof obj.name === "string" &&
      typeof obj.level === "number" &&
      "parents" in obj
    ) {
      const trail: string[] = [];
      const parents = obj.parents;
      if (Array.isArray(parents)) {
        const names: string[] = [];
        for (const p of parents) {
          if (p && typeof p === "object") {
            const pn = (p as { name?: unknown }).name;
            if (typeof pn === "string" && !names.includes(pn)) names.push(pn);
          }
        }
        trail.push(...names);
      }
      if (!trail.includes(obj.name)) trail.push(obj.name);
      if (trail.length > 0) {
        result = trail;
        return;
      }
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }
  walk(nextData);
  return result;
}

function findOfficeAddress(nextData: unknown): string | null {
  const seen = new WeakSet<object>();
  let result: string | null = null;
  function walk(node: unknown) {
    if (result) return;
    if (!node || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (
      "poi" in obj &&
      obj.poi &&
      typeof obj.poi === "object" &&
      typeof (obj.poi as { addressLabel?: unknown }).addressLabel === "string"
    ) {
      result = (obj.poi as { addressLabel: string }).addressLabel;
      return;
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }
  walk(nextData);
  return result;
}

function findScalarFromNextData<T>(
  nextData: unknown,
  keys: string[],
  validate: (v: unknown) => T | null,
): T | null {
  const seen = new WeakSet<object>();
  let result: T | null = null;
  function walk(node: unknown) {
    if (result !== null) return;
    if (!node || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    for (const k of keys) {
      if (k in obj) {
        const v = validate(obj[k]);
        if (v !== null) {
          result = v;
          return;
        }
      }
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }
  walk(nextData);
  return result;
}

function findWorkArrangement(nextData: unknown): string | null {
  const seen = new WeakSet<object>();
  let result: string | null = null;
  function walk(node: unknown) {
    if (result) return;
    if (!node || typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (typeof obj.workArrangementOption === "string") {
      result = obj.workArrangementOption;
      return;
    }
    for (const key of Object.keys(obj)) walk(obj[key]);
  }
  walk(nextData);
  return result;
}

function safeStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function safeNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function parseDetail(entry: IndexEntry, html: string): RawJob {
  const jsonld = extractJsonLd(html);
  const nextData = extractNextData(html);

  const baseSalary = (jsonld?.baseSalary ?? null) as
    | {
        currency?: string;
        value?: { minValue?: number; maxValue?: number; unitText?: string };
      }
    | null;
  const salaryValue = baseSalary?.value;

  const jobLocation = (jsonld?.jobLocation ?? null) as
    | {
        address?: {
          addressLocality?: string;
          addressRegion?: string;
          addressCountry?: string;
        };
      }
    | null;
  const address = jobLocation?.address;

  const hiring = (jsonld?.hiringOrganization ?? null) as
    | { name?: string; logo?: string; sameAs?: string }
    | null;

  const eduReq = (jsonld?.educationRequirements ?? null) as
    | { credentialCategory?: string }
    | null;

  const companyExtras = findCompanyFromNextData(nextData);

  return {
    uuid: entry.uuid,
    slug: entry.slug,
    url: entry.href,
    title: safeStr(jsonld?.title),
    description: safeStr(jsonld?.description),
    datePosted: safeStr(jsonld?.datePosted),
    validThrough: safeStr(jsonld?.validThrough),
    employmentType: safeStr(jsonld?.employmentType),
    directApply:
      typeof jsonld?.directApply === "boolean"
        ? (jsonld.directApply as boolean)
        : null,
    industry: safeStr(jsonld?.industry),
    occupationalCategory: safeStr(jsonld?.occupationalCategory),
    jobBenefits: safeStr(jsonld?.jobBenefits),
    educationCategory: safeStr(eduReq?.credentialCategory),
    companyName: safeStr(hiring?.name),
    companyLogo: safeStr(hiring?.logo),
    companyWebsite: companyExtras.websiteUrl ?? safeStr(hiring?.sameAs),
    companyOverview: safeStr(jsonld?.employerOverview),
    companySize: companyExtras.size,
    companyStatus: companyExtras.status,
    companyInstagramUrl: companyExtras.instagramUrl,
    companyFacebookUrl: companyExtras.facebookUrl,
    companyLinkedInUrl: companyExtras.linkedInUrl,
    industryBreadcrumb: findIndustryBreadcrumb(nextData),
    officeAddress: findOfficeAddress(nextData),
    city: safeStr(address?.addressLocality),
    region: safeStr(address?.addressRegion),
    country: safeStr(address?.addressCountry),
    salaries: findSalaries(nextData),
    salaryMin: safeNum(salaryValue?.minValue),
    salaryMax: safeNum(salaryValue?.maxValue),
    salaryCurrency: safeStr(baseSalary?.currency),
    salaryUnit: safeStr(salaryValue?.unitText),
    skills: findJobSkills(nextData),
    workArrangement: findWorkArrangement(nextData),
    educationLevel: findScalarFromNextData(nextData, ["educationLevel"], (v) =>
      typeof v === "string" && v.length > 0 ? v : null,
    ),
    minYearsOfExperience: findScalarFromNextData(
      nextData,
      ["minYearsOfExperience"],
      (v) => (typeof v === "number" && v >= 0 ? v : null),
    ),
    maxYearsOfExperience: findScalarFromNextData(
      nextData,
      ["maxYearsOfExperience"],
      (v) => (typeof v === "number" && v >= 0 ? v : null),
    ),
    scrapedAt: new Date().toISOString(),
  };
}

function parseArgs(): { target: number } {
  const args = process.argv.slice(2);
  let target = 1000;
  for (const a of args) {
    if (a.startsWith("--target=")) target = parseInt(a.slice(9), 10);
  }
  return { target };
}

async function main() {
  await ensureDir(CACHE_DIR);
  const { target } = parseArgs();

  const entries: IndexEntry[] = JSON.parse(await readFile(INDEX_IN, "utf8"));
  const slice = entries.slice(0, target);
  console.log(`[detail] ${slice.length} jobs to fetch`);

  const jobs: RawJob[] = [];
  for (let i = 0; i < slice.length; i++) {
    const e = slice[i];
    const cache = join(CACHE_DIR, `${e.uuid}.html`);
    const wasCached = await fileExists(cache);
    try {
      const html = await fetchHtml(e.href, cache);
      const job = parseDetail(e, html);
      jobs.push(job);
      if ((i + 1) % 25 === 0 || i + 1 === slice.length) {
        console.log(
          `  ${i + 1}/${slice.length}: ${(job.title ?? "(no title)").slice(0, 50)}`,
        );
      }
      if (!wasCached) await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  detail ${e.uuid} failed:`, String(err).slice(0, 120));
    }
    if ((i + 1) % 100 === 0) {
      await writeFile(OUT, JSON.stringify(jobs, null, 2), "utf8");
    }
  }
  await writeFile(OUT, JSON.stringify(jobs, null, 2), "utf8");
  console.log(`[detail] wrote ${jobs.length} jobs -> ${OUT}`);
}

main().catch((err) => {
  console.error("\nscrape failed:", err);
  process.exit(1);
});

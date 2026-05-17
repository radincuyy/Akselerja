import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as cheerio from "cheerio";

const BASE = "https://karirhub.kemnaker.go.id";
const LIST_PATH = "/lowongan-dalam-negeri/lowongan";
const UA = "Akselerja-Research-Bot/1.0 (academic; contact: hackathon@akselerja.local)";
const DELAY_MS = 1500;
const MAX_RETRIES = 3;

const DATA_DIR = resolve(process.cwd(), "data");
const CACHE_DIR = join(DATA_DIR, "karirhub-cache");
const LIST_CACHE = join(CACHE_DIR, "list");
const DETAIL_CACHE = join(CACHE_DIR, "detail");
const INDEX_OUT = join(DATA_DIR, "karirhub-index.json");
const JOBS_OUT = join(DATA_DIR, "karirhub-jobs.json");

type ListEntry = { slug: string; href: string; uuid: string };

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchHtml(url: string, cachePath: string): Promise<string> {
  if (await fileExists(cachePath)) {
    return readFile(cachePath, "utf8");
  }
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.5",
        },
      });
      if (res.status === 429 || res.status === 503) {
        const wait = DELAY_MS * Math.pow(2, attempt);
        console.warn(`  ${res.status} on ${url}, backing off ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      const html = await res.text();
      await writeFile(cachePath, html, "utf8");
      return html;
    } catch (err) {
      lastErr = err;
      console.warn(`  attempt ${attempt} failed: ${String(err)}`);
      await sleep(DELAY_MS * attempt);
    }
  }
  throw lastErr ?? new Error(`Failed after ${MAX_RETRIES} retries: ${url}`);
}

function parseListPage(html: string): ListEntry[] {
  const $ = cheerio.load(html);
  const out: ListEntry[] = [];
  const seen = new Set<string>();
  $('a[href*="/lowongan-dalam-negeri/lowongan/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/\/lowongan-dalam-negeri\/lowongan\/(.+?)$/);
    if (!m) return;
    const slug = m[1].replace(/&amp;/g, "&");
    if (slug.includes("?") || slug.includes("=")) return;
    const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
    if (!uuidMatch) return;
    if (seen.has(slug)) return;
    seen.add(slug);
    out.push({
      slug,
      uuid: uuidMatch[1],
      href: `${BASE}/lowongan-dalam-negeri/lowongan/${slug}`,
    });
  });
  return out;
}

function extractSection($: cheerio.CheerioAPI, headingText: string): string | null {
  let result: string | null = null;
  $("h2, h3, h4, p, div").each((_, el) => {
    const t = $(el).text().trim();
    if (t === headingText) {
      const collected: string[] = [];
      let next = $(el).next();
      let safety = 0;
      while (next.length && safety < 20) {
        const node = next[0] as { tagName?: string };
        const tag = node.tagName?.toLowerCase();
        if (tag && /^h[1-4]$/.test(tag)) break;
        const tx = next.text().trim();
        if (tx) collected.push(tx);
        next = next.next();
        safety++;
      }
      if (collected.length) {
        result = collected.join("\n").trim();
        return false;
      }
    }
  });
  return result;
}

function parseDetail(url: string, slug: string, uuid: string, html: string): RawJob {
  const $ = cheerio.load(html);
  $("script, style, svg").remove();

  const title = $("h1").first().text().trim();


  const metaWrapper = $("h1").first().parent().children().eq(1);
  const metaRows = metaWrapper.children();
  const location = metaRows.eq(0).text().trim() || null;

  const postedSpan = metaRows.eq(1).find("span").first();
  const postedText = postedSpan.text().trim();
  const postedRelative = postedText
    ? postedText.replace(/^Diposting\s*/i, "").trim() || null
    : null;

  const deadlineRow = metaRows.eq(2);
  const deadlineText = deadlineRow.text().trim();
  const applyDeadline = deadlineText
    ? deadlineText.replace(/^Batas waktu lamaran\s*/i, "").trim() || null
    : null;

  const fieldMap = new Map<string, string>();
  $('[class*="text-gray-500"]').each((_, el) => {
    const label = $(el).text().trim();
    if (!label) return;
    const sibling = $(el).next();
    if (sibling.length) {
      const value = sibling.text().trim();
      if (value && value !== label) {
        fieldMap.set(label, value);
      }
    }
  });

  const fld = (k: string): string | null => fieldMap.get(k) ?? null;

  const description = extractSection($, "Deskripsi Pekerjaan");
  const requirements = extractSection($, "Persyaratan Khusus");

  const skills: string[] = [];
  const skillHeading = $("*")
    .filter((_, el) => $(el).text().trim() === "Keterampilan")
    .last();
  if (skillHeading.length) {
    const chipContainer = skillHeading.next();
    chipContainer.find("span").each((_, chip) => {
      const ct = $(chip).text().trim();
      if (ct && ct.length < 80 && !skills.includes(ct)) {
        skills.push(ct);
      }
    });
  }


  const aboutHeading = $("*")
    .filter((_, el) => $(el).text().trim() === "Tentang Perusahaan")
    .last();
  let companyAbout: string | null = null;
  if (aboutHeading.length) {
    companyAbout = aboutHeading.next().text().trim() || null;
  }

  return {
    uuid,
    slug,
    url,
    title,
    location,
    postedRelative,
    applyDeadline,
    jobField: fld("Bidang pekerjaan"),
    jobType: fld("Jenis pekerjaan"),
    workType: fld("Tipe pekerjaan"),
    genderPreference: fld("Jenis kelamin"),
    salaryRange: fld("Rentang gaji"),
    description,
    requirements,
    minEducation: fld("Minimal pendidikan"),
    maritalStatus: fld("Status Pernikahan"),
    minExperience: fld("Minimal pengalaman"),
    physicalCondition: fld("Kondisi fisik"),
    skills,
    companyName: null,
    companyAbout,
    companyIndustry: null,
    source: null,
    scrapedAt: new Date().toISOString(),
  };
}

function parseArgs(): { stage: "list" | "detail" | "all"; target: number; pages: number } {
  const args = process.argv.slice(2);
  let stage: "list" | "detail" | "all" = "all";
  let target = 3000;
  let pages = 0;
  for (const a of args) {
    if (a.startsWith("--stage=")) stage = a.slice(8) as typeof stage;
    else if (a.startsWith("--target=")) target = parseInt(a.slice(9), 10);
    else if (a.startsWith("--pages=")) pages = parseInt(a.slice(8), 10);
  }
  if (!pages) pages = Math.ceil(target / 19) + 5;
  return { stage, target, pages };
}

async function runListStage(maxPages: number, target: number): Promise<ListEntry[]> {
  await ensureDir(LIST_CACHE);
  const all: ListEntry[] = [];
  const seen = new Set<string>();
  console.log(`[list] crawling up to ${maxPages} pages, target ${target} entries`);
  for (let p = 1; p <= maxPages; p++) {
    const url = `${BASE}${LIST_PATH}?page=${p}`;
    const cache = join(LIST_CACHE, `page-${p}.html`);
    const wasCached = await fileExists(cache);
    try {
      const html = await fetchHtml(url, cache);
      const entries = parseListPage(html);
      let added = 0;
      for (const e of entries) {
        if (!seen.has(e.uuid)) {
          seen.add(e.uuid);
          all.push(e);
          added++;
        }
      }
      console.log(`  page ${p}: +${added} (total ${all.length})${wasCached ? " [cached]" : ""}`);
      if (entries.length === 0) {
        console.log(`  page ${p}: empty, stopping`);
        break;
      }
      if (all.length >= target) {
        console.log(`  reached target ${target}, stopping`);
        break;
      }
      if (!wasCached) await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  page ${p} failed:`, err);
    }
  }
  await writeFile(INDEX_OUT, JSON.stringify(all, null, 2), "utf8");
  console.log(`[list] wrote ${all.length} entries -> ${INDEX_OUT}`);
  return all;
}

async function runDetailStage(entries: ListEntry[], target: number): Promise<RawJob[]> {
  await ensureDir(DETAIL_CACHE);
  const slice = entries.slice(0, target);
  const jobs: RawJob[] = [];
  console.log(`[detail] fetching ${slice.length} job pages`);
  for (let i = 0; i < slice.length; i++) {
    const e = slice[i];
    const cache = join(DETAIL_CACHE, `${e.uuid}.html`);
    const wasCached = await fileExists(cache);
    try {
      const html = await fetchHtml(e.href, cache);
      const job = parseDetail(e.href, e.slug, e.uuid, html);
      jobs.push(job);
      if ((i + 1) % 50 === 0 || i + 1 === slice.length) {
        console.log(`  ${i + 1}/${slice.length}: ${job.title.slice(0, 50)}`);
      }
      if (!wasCached) await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  detail ${e.uuid} failed:`, err);
    }
    if ((i + 1) % 100 === 0) {
      await writeFile(JOBS_OUT, JSON.stringify(jobs, null, 2), "utf8");
    }
  }
  await writeFile(JOBS_OUT, JSON.stringify(jobs, null, 2), "utf8");
  console.log(`[detail] wrote ${jobs.length} jobs -> ${JOBS_OUT}`);
  return jobs;
}

async function main() {
  const { stage, target, pages } = parseArgs();
  await ensureDir(DATA_DIR);
  await ensureDir(CACHE_DIR);

  let entries: ListEntry[] = [];
  if (stage === "list" || stage === "all") {
    entries = await runListStage(pages, target);
  } else {
    const raw = await readFile(INDEX_OUT, "utf8");
    entries = JSON.parse(raw) as ListEntry[];
    console.log(`[detail] loaded ${entries.length} entries from ${INDEX_OUT}`);
  }

  if (stage === "detail" || stage === "all") {
    await runDetailStage(entries, target);
  }
  console.log("done.");
}

main().catch((err) => {
  console.error("\nscrape failed:", err);
  process.exit(1);
});

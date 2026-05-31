import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const BASE = "https://glints.com";
const SITEMAP_INDEX = `${BASE}/sitemap_index.xml`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const DELAY_MS = 2000;
const MAX_RETRIES = 3;

const DATA_DIR = resolve(process.cwd(), "data");
const CACHE_DIR = join(DATA_DIR, "glints-cache", "sitemap");
const OUT = join(DATA_DIR, "glints-index.json");

type Entry = { slug: string; uuid: string; href: string };

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

async function fetchText(url: string, cachePath: string): Promise<string> {
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
        throw new Error(`HTTP ${status} for ${url}`);
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

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

function parseJobUrl(url: string): { slug: string; uuid: string } | null {
  const m = url.match(
    /\/id\/opportunities\/jobs\/([^/]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (!m) return null;
  return { slug: m[1], uuid: m[2] };
}

function parseArgs(): { target: number; sitemaps: number } {
  const args = process.argv.slice(2);
  let target = 1000;
  let sitemaps = 0;
  for (const a of args) {
    if (a.startsWith("--target=")) target = parseInt(a.slice(9), 10);
    else if (a.startsWith("--sitemaps=")) sitemaps = parseInt(a.slice(11), 10);
  }
  if (!sitemaps) sitemaps = Math.ceil(target / 100) + 2;
  return { target, sitemaps };
}

async function main() {
  await ensureDir(CACHE_DIR);
  const { target, sitemaps: maxSitemaps } = parseArgs();
  console.log(`[sitemap] target ${target} jobs across up to ${maxSitemaps} sub-sitemaps`);

  const indexXml = await fetchText(
    SITEMAP_INDEX,
    join(CACHE_DIR, "_index.xml"),
  );
  const subSitemaps = extractLocs(indexXml).filter((u) =>
    /sitemap_job_id_\d+\.xml/.test(u),
  );
  console.log(`[sitemap] found ${subSitemaps.length} job sub-sitemaps`);

  const all = new Map<string, Entry>();
  for (let i = 0; i < Math.min(maxSitemaps, subSitemaps.length); i++) {
    const url = subSitemaps[i];
    const cacheName = `sub_${i + 1}.xml`;
    const wasCached = await fileExists(join(CACHE_DIR, cacheName));
    try {
      const xml = await fetchText(url, join(CACHE_DIR, cacheName));
      const locs = extractLocs(xml);
      let added = 0;
      for (const loc of locs) {
        const parsed = parseJobUrl(loc);
        if (!parsed) continue;
        if (loc.includes("/id/en/")) continue;
        if (all.has(parsed.uuid)) continue;
        all.set(parsed.uuid, {
          slug: parsed.slug,
          uuid: parsed.uuid,
          href: loc,
        });
        added++;
      }
      console.log(
        `  sub ${i + 1}/${maxSitemaps}: +${added} (total ${all.size})${wasCached ? " [cached]" : ""}`,
      );
      if (all.size >= target) {
        console.log(`  reached target ${target}, stopping`);
        break;
      }
      if (!wasCached) await sleep(DELAY_MS);
    } catch (err) {
      console.error(`  sub ${i + 1} failed:`, err);
    }
  }

  const entries = [...all.values()].slice(0, target);
  await writeFile(OUT, JSON.stringify(entries, null, 2), "utf8");
  console.log(`[sitemap] wrote ${entries.length} entries -> ${OUT}`);
}

main().catch((err) => {
  console.error("\nsitemap scrape failed:", err);
  process.exit(1);
});

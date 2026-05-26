import { CosmosClient } from "@azure/cosmos";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { config } from "dotenv";
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { embedText } from "../lib/gemini-embed";
import { skillById } from "../lib/skills";
import type { Job } from "../lib/types";

config({ path: resolve(process.cwd(), ".env.local") });

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_JOBS ?? "jobs-v1";

const CACHE_PATH = resolve(process.cwd(), "data/job-vectors.json");
// Free-tier Gemini embedding caps at 15 RPM. 4500ms ≈ 13 RPM gives headroom
// against bursts that share the 1500 RPD quota with CV parsing.
const REQ_DELAY_MS = 4500;
const FLUSH_INTERVAL = 25;
const BACKOFF_INITIAL_MS = 5_000;
const BACKOFF_MAX_MS = 120_000;

if (!COSMOS_ENDPOINT || !COSMOS_KEY || !SEARCH_ENDPOINT || !SEARCH_KEY) {
  console.error(
    "Missing COSMOS_* or AZURE_SEARCH_* in .env.local",
  );
  process.exit(1);
}

type CacheEntry = { hash: string; vector: number[] };
type Cache = Record<string, CacheEntry>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildEmbedText(job: Job): string {
  const skillNames = (job.requirements ?? [])
    .map((r) => skillById[r.skillId]?.name ?? r.skillId)
    .filter(Boolean)
    .join(", ");
  const desc = (job.description ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
  const parts = [
    job.title,
    job.industry,
    job.location,
    skillNames ? `Skills: ${skillNames}` : "",
    desc,
  ].filter(Boolean);
  return parts.join("\n");
}

function contentHash(text: string): string {
  return createHash("sha1").update(text).digest("hex").slice(0, 16);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadCache(): Promise<Cache> {
  if (!(await fileExists(CACHE_PATH))) return {};
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

async function saveCache(cache: Cache): Promise<void> {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache), "utf8");
}

async function main() {
  console.log(`[embed-jobs] starting`);
  const cosmos = new CosmosClient({
    endpoint: COSMOS_ENDPOINT!,
    key: COSMOS_KEY!,
  });
  const container = cosmos.database(COSMOS_DATABASE).container("jobs");

  const search = new SearchClient(
    SEARCH_ENDPOINT!,
    INDEX_NAME,
    new AzureKeyCredential(SEARCH_KEY!),
  );

  const { resources: jobs } = await container.items
    .query<Job>({ query: "SELECT * FROM c" })
    .fetchAll();
  console.log(`  pulled ${jobs.length} jobs from Cosmos`);

  const cache = await loadCache();
  console.log(`  cache has ${Object.keys(cache).length} prior entries`);

  let embedded = 0;
  let cached = 0;
  let failed = 0;
  let backoffMs = BACKOFF_INITIAL_MS;
  let pendingUploads: { id: string; descriptionVector: number[] }[] = [];

  async function flushUploads() {
    if (pendingUploads.length === 0) return;
    try {
      const result = await search.mergeOrUploadDocuments(pendingUploads);
      const ok = result.results.filter((r) => r.succeeded).length;
      const bad = result.results.length - ok;
      if (bad > 0) {
        for (const r of result.results.filter((x) => !x.succeeded)) {
          console.warn(`    upload failed for ${r.key}: ${r.errorMessage}`);
        }
      }
      console.log(`  flushed ${ok}/${pendingUploads.length} vectors to AI Search`);
    } catch (err) {
      console.error("  flush failed:", err);
    } finally {
      pendingUploads = [];
    }
  }

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const text = buildEmbedText(job);
    const hash = contentHash(text);
    const cached_entry = cache[job.id];

    let vector: number[];
    if (cached_entry && cached_entry.hash === hash) {
      vector = cached_entry.vector;
      cached++;
    } else {
      try {
        vector = await embedText(text, "RETRIEVAL_DOCUMENT");
        cache[job.id] = { hash, vector };
        embedded++;
        backoffMs = BACKOFF_INITIAL_MS;
        await sleep(REQ_DELAY_MS);
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 429) {
          const jitter = Math.floor(Math.random() * 2_000);
          const wait = backoffMs + jitter;
          console.warn(
            `  ${i + 1}/${jobs.length} 429 from Gemini; backing off ${Math.round(wait / 1000)}s`,
          );
          await sleep(wait);
          backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
          i--; // retry same job
          continue;
        }
        console.error(
          `  ${i + 1}/${jobs.length} embed failed for ${job.id}: ${String(err).slice(0, 200)}`,
        );
        failed++;
        continue;
      }
    }

    pendingUploads.push({ id: job.id, descriptionVector: vector });

    try {
      await container
        .item(job.id, job.companyId ?? job.id)
        .patch([{ op: "set", path: "/descriptionVector", value: vector }]);
    } catch (err) {
      console.warn(
        `  cosmos vector patch failed for ${job.id}: ${String(err).slice(0, 120)}`,
      );
    }

    if ((i + 1) % FLUSH_INTERVAL === 0 || i + 1 === jobs.length) {
      console.log(
        `  ${i + 1}/${jobs.length} (embedded=${embedded} cached=${cached} failed=${failed})`,
      );
      await flushUploads();
      await saveCache(cache);
    }
  }

  await flushUploads();
  await saveCache(cache);

  console.log(
    `\n[embed-jobs] done. embedded=${embedded} cached=${cached} failed=${failed}`,
  );
}

main().catch((err) => {
  console.error("\nembed-jobs failed:", err);
  process.exit(1);
});

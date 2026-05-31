import { CosmosClient } from "@azure/cosmos";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { config } from "dotenv";
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { embedTextsQwen } from "../lib/ai/qwen-client";
import { buildJobEmbedText, categoryHintFromJob } from "../lib/ai/embed-text";
import type { Job } from "../lib/shared/types";

config({ path: resolve(process.cwd(), ".env.local") });

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_JOBS ?? "jobs-v1";

const CACHE_PATH = resolve(process.cwd(), "data/job-vectors-qwen.json");
const BATCH_SIZE = 10;
const REQ_DELAY_MS = 500;
const FLUSH_INTERVAL = 50;
const BACKOFF_INITIAL_MS = 5_000;
const BACKOFF_MAX_MS = 60_000;

if (!COSMOS_ENDPOINT || !COSMOS_KEY || !SEARCH_ENDPOINT || !SEARCH_KEY) {
  console.error("Missing COSMOS_* or AZURE_SEARCH_* in .env.local");
  process.exit(1);
}

type CacheEntry = { hash: string; vector: number[] };
type Cache = Record<string, CacheEntry>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

type CosmosContainer = ReturnType<
  ReturnType<CosmosClient["database"]>["container"]
>;

async function patchCosmosVector(
  container: CosmosContainer,
  itemId: string,
  partitionKey: string,
  ops: { op: "set"; path: string; value: unknown }[],
): Promise<void> {
  let backoff = 800;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await container.item(itemId, partitionKey).patch(ops);
      return;
    } catch (err) {
      const code =
        (err as { code?: number; statusCode?: number })?.code ??
        (err as { statusCode?: number })?.statusCode;
      const throttled =
        code === 429 || /request rate is too large/i.test(String(err));
      if (!throttled) throw err;
      const jitter = Math.floor(Math.random() * 400);
      await sleep(backoff + jitter);
      backoff = Math.min(backoff * 2, 20_000);
    }
  }
  throw new Error(`cosmos patch retries exhausted for ${itemId}`);
}

async function main() {
  console.log(`[embed-jobs-qwen] starting`);
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

  type WorkItem = { job: Job; text: string; hash: string };
  const queue: WorkItem[] = jobs.map((job) => {
    const text = buildJobEmbedText(job);
    return { job, text, hash: contentHash(text) };
  });

  let i = 0;
  while (i < queue.length) {
    const batchItems: WorkItem[] = [];
    while (batchItems.length < BATCH_SIZE && i < queue.length) {
      const item = queue[i];
      const cached_entry = cache[item.job.id];
      if (cached_entry && cached_entry.hash === item.hash) {
        const vector = cached_entry.vector;
        cached++;
        const categoryHint = categoryHintFromJob(item.job);
        try {
          await patchCosmosVector(
            container,
            item.job.id,
            item.job.companyId ?? item.job.id,
            [
              { op: "set", path: "/descriptionVector", value: vector },
              { op: "set", path: "/categoryHint", value: categoryHint },
              { op: "set", path: "/embedProvider", value: "qwen" },
            ],
          );
          pendingUploads.push({ id: item.job.id, descriptionVector: vector });
        } catch (err) {
          console.warn(
            `  cosmos patch failed for ${item.job.id}: ${String(err).slice(0, 120)}`,
          );
        }
        i++;
        continue;
      }
      batchItems.push(item);
      i++;
    }

    if (batchItems.length === 0) {
      if ((i + 1) % FLUSH_INTERVAL === 0 || i === queue.length) {
        console.log(`  ${i}/${queue.length} (embedded=${embedded} cached=${cached} failed=${failed})`);
        await flushUploads();
        await saveCache(cache);
      }
      continue;
    }

    let vectors: number[][] | null = null;
    try {
      vectors = await embedTextsQwen(batchItems.map((b) => b.text));
      backoffMs = BACKOFF_INITIAL_MS;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 429 || status === 503 || status === 502) {
        const jitter = Math.floor(Math.random() * 2_000);
        const wait = backoffMs + jitter;
        console.warn(
          `  ${i}/${queue.length} ${status} from Qwen; backing off ${Math.round(wait / 1000)}s`,
        );
        await sleep(wait);
        backoffMs = Math.min(backoffMs * 2, BACKOFF_MAX_MS);
        i -= batchItems.length;
        continue;
      }
      console.error(
        `  ${i}/${queue.length} batch embed failed: ${String(err).slice(0, 200)}`,
      );
      failed += batchItems.length;
      continue;
    }

    for (let k = 0; k < batchItems.length; k++) {
      const item = batchItems[k];
      const vector = vectors![k];
      cache[item.job.id] = { hash: item.hash, vector };
      embedded++;

      const categoryHint = categoryHintFromJob(item.job);
      pendingUploads.push({ id: item.job.id, descriptionVector: vector });

      try {
        await patchCosmosVector(
          container,
          item.job.id,
          item.job.companyId ?? item.job.id,
          [
            { op: "set", path: "/descriptionVector", value: vector },
            { op: "set", path: "/categoryHint", value: categoryHint },
            { op: "set", path: "/embedProvider", value: "qwen" },
          ],
        );
      } catch (err) {
        console.warn(
          `  cosmos patch failed for ${item.job.id}: ${String(err).slice(0, 120)}`,
        );
      }
    }

    if (i % FLUSH_INTERVAL === 0 || i >= queue.length) {
      console.log(`  ${i}/${queue.length} (embedded=${embedded} cached=${cached} failed=${failed})`);
      await flushUploads();
      await saveCache(cache);
    }

    await sleep(REQ_DELAY_MS);
  }

  await flushUploads();
  await saveCache(cache);

  console.log(
    `\n[embed-jobs-qwen] done. embedded=${embedded} cached=${cached} failed=${failed}`,
  );
}

main().catch((err) => {
  console.error("\nembed-jobs-qwen failed:", err);
  process.exit(1);
});

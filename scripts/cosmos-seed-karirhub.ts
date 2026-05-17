/**
 * Seed Cosmos DB `jobs` container from data/akselerja-jobs.json (scraped + normalized
 * Karirhub data). Uses bulk upsert for ~1000-3000 records.
 *
 * Run after `scripts/normalize-karirhub.ts` finishes.
 */

import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Job } from "../lib/types";

config({ path: resolve(process.cwd(), ".env.local") });

const ENDPOINT = process.env.COSMOS_ENDPOINT;
const KEY = process.env.COSMOS_KEY;
const DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";
const INPUT = resolve(process.cwd(), "data/akselerja-jobs.json");

function parseArgs(): { dryRun: boolean; batch: number } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let batch = 10;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a.startsWith("--batch=")) batch = Math.max(1, parseInt(a.slice(8), 10));
  }
  return { dryRun, batch };
}

async function main() {
  const { dryRun, batch } = parseArgs();

  if (!dryRun && (!ENDPOINT || !KEY)) {
    console.error("Missing COSMOS_ENDPOINT or COSMOS_KEY in .env.local");
    process.exit(1);
  }

  const buf = await readFile(INPUT, "utf8");
  const jobs: Job[] = JSON.parse(buf);
  console.log(`Loaded ${jobs.length} jobs from ${INPUT}`);

  if (dryRun) {
    console.log("DRY RUN — no Cosmos calls. Sample record:");
    console.log(JSON.stringify(jobs[0], null, 2));
    return;
  }

  const client = new CosmosClient({ endpoint: ENDPOINT!, key: KEY! });
  const database = client.database(DATABASE);
  const container = database.container("jobs");

  console.log(`Upserting in batches of ${batch}...`);
  let done = 0;
  let failed = 0;
  for (let i = 0; i < jobs.length; i += batch) {
    const slice = jobs.slice(i, i + batch);
    await Promise.all(
      slice.map(async (job) => {
        try {
          await container.items.upsert(job);
          done++;
        } catch (err) {
          failed++;
          console.error(`  failed ${job.id} (${job.title.slice(0, 40)}):`, String(err).slice(0, 200));
        }
      }),
    );
    if (done % 100 === 0 || i + batch >= jobs.length) {
      console.log(`  upserted ${done}/${jobs.length} (${failed} failed)`);
    }
  }
  console.log(`\nDone. ${done} upserted, ${failed} failed.`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err);
  process.exit(1);
});

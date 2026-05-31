/**
 * Replace ALL jobs in Cosmos `jobs` container with data/akselerja-jobs.json.
 *
 * 1. Query all existing job ids (with companyId for partition key)
 * 2. Bulk delete them
 * 3. Bulk upsert from akselerja-jobs.json
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

function parseArgs(): { dryRun: boolean; batch: number; skipDelete: boolean } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let batch = 10;
  let skipDelete = false;
  for (const a of args) {
    if (a === "--dry-run") dryRun = true;
    else if (a === "--skip-delete") skipDelete = true;
    else if (a.startsWith("--batch="))
      batch = Math.max(1, parseInt(a.slice(8), 10));
  }
  return { dryRun, batch, skipDelete };
}

async function main() {
  const { dryRun, batch, skipDelete } = parseArgs();

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

  if (!skipDelete && process.env.COSMOS_ALLOW_DESTRUCTIVE !== "1") {
    console.error(
      "Refusing to wipe the jobs container. This deletes ALL jobs in " +
        `"${DATABASE}" at ${ENDPOINT}.\n` +
        "If that is intended, re-run with COSMOS_ALLOW_DESTRUCTIVE=1, or pass " +
        "--skip-delete to only upsert, or --dry-run to preview.",
    );
    process.exit(1);
  }

  const client = new CosmosClient({ endpoint: ENDPOINT!, key: KEY! });
  const container = client.database(DATABASE).container("jobs");

  if (!skipDelete) {
    console.log("Querying existing job ids...");
    const { resources: existing } = await container.items
      .query<{ id: string; companyId?: string }>({
        query: "SELECT c.id, c.companyId FROM c",
      })
      .fetchAll();
    console.log(`Found ${existing.length} existing jobs to delete`);

    let deleted = 0;
    let delFailed = 0;
    for (let i = 0; i < existing.length; i += batch) {
      const slice = existing.slice(i, i + batch);
      await Promise.all(
        slice.map(async (j) => {
          const partition = j.companyId ?? "unknown";
          try {
            await container.item(j.id, partition).delete();
            deleted++;
          } catch (err: unknown) {
            const code = (err as { code?: number })?.code;
            if (code === 404) {
              deleted++;
            } else {
              delFailed++;
              console.error(
                `  delete failed ${j.id}:`,
                String(err).slice(0, 150),
              );
            }
          }
        }),
      );
      if (deleted % 100 === 0 || i + batch >= existing.length) {
        console.log(
          `  deleted ${deleted}/${existing.length} (${delFailed} failed)`,
        );
      }
    }
    console.log(`Delete done. ${deleted} removed, ${delFailed} failed.`);
  }

  console.log(`Upserting ${jobs.length} jobs in batches of ${batch}...`);
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
          console.error(
            `  upsert failed ${job.id} (${job.title.slice(0, 40)}):`,
            String(err).slice(0, 150),
          );
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
  console.error("\nReplace failed:", err);
  process.exit(1);
});

import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { resolve } from "path";
import { deriveIndustryId } from "../lib/industry-mapping";

config({ path: resolve(process.cwd(), ".env.local") });

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
  console.error("Missing COSMOS_ENDPOINT or COSMOS_KEY in .env.local");
  process.exit(1);
}

type JobDoc = {
  id: string;
  companyId: string;
  industryBreadcrumb?: string[];
  industryId?: string;
} & Record<string, unknown>;

async function main() {
  const cosmos = new CosmosClient({
    endpoint: COSMOS_ENDPOINT!,
    key: COSMOS_KEY!,
  });
  const container = cosmos.database(COSMOS_DATABASE).container("jobs");
  const { resources } = await container.items
    .query<JobDoc>({ query: "SELECT * FROM c" })
    .fetchAll();

  console.log(`Pulled ${resources.length} jobs from Cosmos.`);
  let migrated = 0;
  let skipped = 0;
  let unmapped = 0;
  let failed = 0;
  const unmappedBreadcrumbs = new Set<string>();

  for (const job of resources) {
    const derived = deriveIndustryId(job.industryBreadcrumb);
    // Skip if already correct.
    if (job.industryId && job.industryId === derived) {
      skipped++;
      continue;
    }
    if (!derived) {
      unmapped++;
      if (job.industryBreadcrumb && job.industryBreadcrumb[0]) {
        unmappedBreadcrumbs.add(job.industryBreadcrumb[0]);
      }
      // Still upsert if industryId was previously set but mapping no longer
      // covers this breadcrumb, to clear the stale value.
      if (!job.industryId) continue;
    }
    try {
      await container.item(job.id, job.companyId).replace({
        ...job,
        industryId: derived ?? undefined,
      });
      migrated++;
    } catch (err) {
      failed++;
      console.warn(`Failed to migrate ${job.id}:`, err);
    }
  }

  console.log(
    `\nDone: migrated=${migrated}, skipped=${skipped}, unmapped=${unmapped}, failed=${failed}.`,
  );
  if (unmappedBreadcrumbs.size > 0) {
    console.log(
      `\nBreadcrumbs without an industryId mapping (consider adding to lib/industry-mapping.ts):`,
    );
    for (const b of [...unmappedBreadcrumbs].sort()) {
      console.log(`  - ${b}`);
    }
  }
  console.log(
    "\nNext step: npx tsx scripts/search-sync.ts (to refresh AI Search index).",
  );
}

main().catch((err) => {
  console.error("\nMigration failed:");
  console.error(err);
  process.exit(1);
});

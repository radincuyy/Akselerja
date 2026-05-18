import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
  console.error("Missing COSMOS_ENDPOINT or COSMOS_KEY in .env.local");
  process.exit(1);
}

type LegacyRequirement = {
  skillId: string;
  required?: number;
  mustHave?: boolean;
  weight?: number;
  name?: string;
};

type JobDoc = {
  id: string;
  companyId: string;
  requirements?: LegacyRequirement[];
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
  let failed = 0;

  for (const job of resources) {
    const reqs = job.requirements ?? [];
    if (reqs.length === 0) {
      skipped++;
      continue;
    }
    const needsUpdate = reqs.some(
      (r) => typeof r.required === "number" || typeof r.mustHave !== "boolean",
    );
    if (!needsUpdate) {
      skipped++;
      continue;
    }
    const nextReqs = reqs.map((r) => {
      const mustHave =
        typeof r.mustHave === "boolean"
          ? r.mustHave
          : typeof r.required === "number"
            ? r.required >= 2
            : false;
      const { required: _legacy, ...rest } = r;
      return { ...rest, mustHave };
    });

    try {
      await container.item(job.id, job.companyId).replace({
        ...job,
        requirements: nextReqs,
      });
      migrated++;
    } catch (err) {
      failed++;
      console.warn(`Failed to migrate ${job.id}:`, err);
    }
  }

  console.log(
    `\nDone: migrated=${migrated}, skipped=${skipped}, failed=${failed}.`,
  );
  console.log(
    "\nNext step: npx tsx scripts/search-sync.ts (to refresh AI Search index).",
  );
}

main().catch((err) => {
  console.error("\nMigration failed:");
  console.error(err);
  process.exit(1);
});

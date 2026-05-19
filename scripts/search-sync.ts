import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_JOBS ?? "jobs-v1";

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

if (!SEARCH_ENDPOINT || !SEARCH_KEY) {
  console.error(
    "Missing AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_KEY in .env.local",
  );
  process.exit(1);
}
if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
  console.error("Missing COSMOS_ENDPOINT or COSMOS_KEY in .env.local");
  process.exit(1);
}

type CosmosJob = {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  type: string;
  industry: string;
  industryId?: string;
  description: string;
  requirements: { skillId: string; required: number; weight?: number }[];
  postedAt: string;
  status?: "open" | "closed";
  minExperienceYears?: number;
  maxExperienceYears?: number;
  minEducation?: string;
};

type IndexedJob = {
  id: string;
  title: string;
  company: string;
  description: string;
  industry: string;
  industryId: string | null;
  location: string;
  city: string;
  skillIds: string[];
  salaryMin: number;
  salaryMax: number;
  type: string;
  status: "open" | "closed";
  postedAt: string;
  companyId: string;
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  minEducation: string | null;
};

function shortCity(location: string): string {
  return location.split(",")[0].trim();
}

async function main() {
  console.log(`Sync target index: ${INDEX_NAME}`);
  const { slugifyCompany } = await import("../lib/jobs-store");

  const cosmos = new CosmosClient({
    endpoint: COSMOS_ENDPOINT!,
    key: COSMOS_KEY!,
  });
  const container = cosmos
    .database(COSMOS_DATABASE)
    .container("jobs");

  const { resources } = await container.items
    .query<CosmosJob>({ query: "SELECT * FROM c" })
    .fetchAll();
  console.log(`Pulled ${resources.length} jobs from Cosmos.`);

  const docs: IndexedJob[] = resources.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    description: j.description,
    industry: j.industry,
    industryId: j.industryId ?? null,
    location: j.location,
    city: shortCity(j.location),
    skillIds: (j.requirements ?? []).map((r) => r.skillId),
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    type: j.type,
    status: j.status ?? "open",
    postedAt: j.postedAt,
    companyId: j.companyId ?? slugifyCompany(j.company),
    minExperienceYears:
      typeof j.minExperienceYears === "number" ? j.minExperienceYears : null,
    maxExperienceYears:
      typeof j.maxExperienceYears === "number" ? j.maxExperienceYears : null,
    minEducation: j.minEducation ?? null,
  }));

  const searchClient = new SearchClient<IndexedJob>(
    SEARCH_ENDPOINT!,
    INDEX_NAME,
    new AzureKeyCredential(SEARCH_KEY!),
  );

  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const chunk = docs.slice(i, i + CHUNK);
    const result = await searchClient.mergeOrUploadDocuments(chunk);
    const ok = result.results.filter((r) => r.succeeded).length;
    written += ok;
    const failed = result.results.filter((r) => !r.succeeded);
    if (failed.length > 0) {
      console.warn(
        `Chunk ${i / CHUNK + 1}: ${ok} ok, ${failed.length} failed.`,
      );
      for (const f of failed) {
        console.warn(`  - ${f.key}: ${f.errorMessage ?? "(no message)"}`);
      }
    }
  }

  console.log(`\nSynced ${written} / ${docs.length} jobs to "${INDEX_NAME}".`);
}

main().catch((err) => {
  console.error("\nSync failed:");
  console.error(err);
  process.exit(1);
});

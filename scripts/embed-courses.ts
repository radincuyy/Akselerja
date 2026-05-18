/**
 * Embed each course (title + description + skillId) into a 768-dim vector via
 * Gemini, then patch the vector back into Cosmos so the runtime can rank
 * courses against a candidate's skill gaps without another network call.
 *
 * Idempotent: skips courses that already carry a `courseVector` field. Re-run
 * after seeding new courses or after editing course descriptions.
 *
 *   npx tsx scripts/embed-courses.ts
 */
import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { resolve } from "path";
import { embedText } from "../lib/gemini-embed";

config({ path: resolve(process.cwd(), ".env.local") });

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
  console.error("Missing COSMOS_ENDPOINT or COSMOS_KEY in .env.local");
  process.exit(1);
}

type CourseDoc = {
  id: string;
  title: string;
  provider: string;
  description: string;
  skillId: string;
  courseVector?: number[];
} & Record<string, unknown>;

function buildEmbedText(course: CourseDoc): string {
  return [
    `Kursus: ${course.title}`,
    `Skill: ${course.skillId}`,
    course.description,
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const cosmos = new CosmosClient({
    endpoint: COSMOS_ENDPOINT!,
    key: COSMOS_KEY!,
  });
  const container = cosmos.database(COSMOS_DATABASE).container("courses");
  const { resources } = await container.items
    .query<CourseDoc>({ query: "SELECT * FROM c" })
    .fetchAll();

  console.log(`Pulled ${resources.length} courses from Cosmos.`);
  let embedded = 0;
  let skipped = 0;
  let failed = 0;

  for (const course of resources) {
    if (Array.isArray(course.courseVector) && course.courseVector.length === 768) {
      skipped++;
      continue;
    }
    const text = buildEmbedText(course);
    try {
      const vector = await embedText(text, "RETRIEVAL_DOCUMENT");
      await container.item(course.id, course.id).patch([
        { op: "set", path: "/courseVector", value: vector },
        {
          op: "set",
          path: "/courseVectorUpdatedAt",
          value: new Date().toISOString(),
        },
      ]);
      embedded++;
      console.log(`  embedded ${course.id} (${course.title})`);
    } catch (err) {
      failed++;
      console.warn(`  failed ${course.id}:`, err);
    }
  }

  console.log(
    `\nDone: embedded=${embedded}, skipped=${skipped}, failed=${failed}.`,
  );
}

main().catch((err) => {
  console.error("\nEmbed failed:");
  console.error(err);
  process.exit(1);
});

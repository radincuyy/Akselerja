import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const ENDPOINT = process.env.COSMOS_ENDPOINT;
const KEY = process.env.COSMOS_KEY;
const DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

if (!ENDPOINT || !KEY) {
  console.error("Missing COSMOS_ENDPOINT or COSMOS_KEY in .env.local");
  process.exit(1);
}

const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });

const containers = [
  { id: "jobs", partitionKey: "/companyId" },
  { id: "candidates", partitionKey: "/userId" },
  { id: "practiceAttempts", partitionKey: "/userId" },
  { id: "users", partitionKey: "/email" },
  { id: "courses", partitionKey: "/id" },
  { id: "practiceTasks", partitionKey: "/id" },
  { id: "assessments", partitionKey: "/id" },
  { id: "assessmentQuestions", partitionKey: "/assessmentId" },
  { id: "aiCache", partitionKey: "/key" },
];

async function main() {
  console.log(`Setting up Cosmos database: ${DATABASE}`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  const { database } = await client.databases.createIfNotExists({
    id: DATABASE,
  });
  console.log(`Database "${database.id}" ready.`);

  for (const def of containers) {
    const { container } = await database.containers.createIfNotExists({
      id: def.id,
      partitionKey: { paths: [def.partitionKey] },
    });
    console.log(`Container "${container.id}" ready (partition: ${def.partitionKey})`);
  }

  console.log("\nSetup complete. Database and containers ready.");
}

main().catch((err) => {
  console.error("\nSetup failed:");
  console.error(err);
  process.exit(1);
});

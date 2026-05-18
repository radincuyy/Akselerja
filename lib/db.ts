import { CosmosClient, type Database } from "@azure/cosmos";

let _client: CosmosClient | null = null;
let _database: Database | null = null;

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

export function isCosmosConfigured(): boolean {
  return Boolean(COSMOS_ENDPOINT && COSMOS_KEY);
}

export function getCosmos(): { client: CosmosClient; database: Database } {
  if (!isCosmosConfigured()) {
    throw new Error(
      "Cosmos DB not configured. Set COSMOS_ENDPOINT and COSMOS_KEY in .env.local",
    );
  }
  if (!_client) {
    _client = new CosmosClient({
      endpoint: COSMOS_ENDPOINT!,
      key: COSMOS_KEY!,
    });
    _database = _client.database(COSMOS_DATABASE);
  }
  return { client: _client, database: _database! };
}

export const CONTAINERS = {
  applications: "applications",
  notes: "notes",
  jobs: "jobs",
  candidates: "candidates",
  practiceAttempts: "practiceAttempts",
  users: "users",
  courses: "courses",
  practiceTasks: "practiceTasks",
  assessments: "assessments",
  assessmentQuestions: "assessmentQuestions",
} as const;

export type ContainerName = (typeof CONTAINERS)[keyof typeof CONTAINERS];

export function getContainer(name: ContainerName) {
  const { database } = getCosmos();
  return database.container(name);
}

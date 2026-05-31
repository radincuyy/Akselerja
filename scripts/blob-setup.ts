import { BlobServiceClient } from "@azure/storage-blob";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAMES = [
  process.env.AZURE_STORAGE_CV_CONTAINER ??
    process.env.BLOB_CONTAINER_CV ??
    "cvs",
  process.env.AZURE_STORAGE_PRACTICE_CONTAINER ??
    process.env.BLOB_CONTAINER_PRACTICE ??
    "practice-evidence",
];

if (!CONNECTION_STRING) {
  console.error("Missing AZURE_STORAGE_CONNECTION_STRING in .env or .env.local");
  process.exit(1);
}

async function main() {
  const service = BlobServiceClient.fromConnectionString(CONNECTION_STRING!);
  for (const containerName of CONTAINER_NAMES) {
    const container = service.getContainerClient(containerName);
    console.log(`Target container: ${containerName}`);

    const result = await container.createIfNotExists({ access: undefined });
    if (result.succeeded) {
      console.log(`Container "${containerName}" created (private).`);
    } else {
      console.log(`Container "${containerName}" already exists.`);
    }
  }
}

main().catch((err) => {
  console.error("\nBlob setup failed:");
  console.error(err);
  process.exit(1);
});

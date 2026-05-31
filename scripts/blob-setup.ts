import { BlobServiceClient } from "@azure/storage-blob";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME =
  process.env.AZURE_STORAGE_CV_CONTAINER ??
  process.env.BLOB_CONTAINER_CV ??
  "cvs";

if (!CONNECTION_STRING) {
  console.error("Missing AZURE_STORAGE_CONNECTION_STRING in .env.local");
  process.exit(1);
}

async function main() {
  const service = BlobServiceClient.fromConnectionString(CONNECTION_STRING!);
  const container = service.getContainerClient(CONTAINER_NAME);
  console.log(`Target container: ${CONTAINER_NAME}`);


  const result = await container.createIfNotExists({ access: undefined });
  if (result.succeeded) {
    console.log(`Container "${CONTAINER_NAME}" created (private).`);
  } else {
    console.log(`Container "${CONTAINER_NAME}" already exists.`);
  }
}

main().catch((err) => {
  console.error("\nBlob setup failed:");
  console.error(err);
  process.exit(1);
});

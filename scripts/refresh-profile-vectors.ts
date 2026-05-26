/**
 * One-shot: refresh profileVector untuk semua candidate yang vector-nya
 * masih kosong atau stale. Jalankan setelah perubahan rumus buildProfileText
 * atau saat profile lama tidak punya vector.
 *
 *   npx tsx scripts/refresh-profile-vectors.ts
 */
import { CosmosClient } from "@azure/cosmos";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT!;
const COSMOS_KEY = process.env.COSMOS_KEY!;
const COSMOS_DATABASE = process.env.COSMOS_DATABASE ?? "akselerja";

async function main() {
  const { refreshProfileVector } = await import("../lib/profile-summary");

  const cosmos = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY,
  });
  const container = cosmos.database(COSMOS_DATABASE).container("candidates");
  const { resources } = await container.items
    .query<{ id: string; userId?: string; email?: string }>({
      query: "SELECT c.id, c.userId, c.email FROM c",
    })
    .fetchAll();

  console.log(`Found ${resources.length} candidate(s).`);
  let ok = 0;
  let fail = 0;
  for (const c of resources) {
    if (c.id === "me") continue;
    try {
      await refreshProfileVector(c.id);
      console.log(`  ${c.id} (${c.email ?? "?"}) refreshed`);
      ok++;
    } catch (err) {
      console.warn(`  ${c.id} failed:`, err);
      fail++;
    }
  }
  console.log(`\nDone. refreshed=${ok} failed=${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

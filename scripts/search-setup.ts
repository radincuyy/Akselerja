import { SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const KEY = process.env.AZURE_SEARCH_KEY;
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_JOBS ?? "jobs-v1";

const VECTOR_DIMENSIONS = 768;
const VECTOR_PROFILE = "akselerja-vector-profile";
const VECTOR_ALGORITHM = "akselerja-hnsw";

if (!ENDPOINT || !KEY) {
  console.error(
    "Missing AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_KEY in .env.local",
  );
  process.exit(1);
}

const indexClient = new SearchIndexClient(ENDPOINT, new AzureKeyCredential(KEY));

async function main() {
  console.log(`Search endpoint: ${ENDPOINT}`);
  console.log(`Target index:    ${INDEX_NAME}\n`);

  const indexDef = {
    name: INDEX_NAME,
    fields: [
      {
        name: "id",
        type: "Edm.String" as const,
        key: true,
        filterable: true,
        retrievable: true,
      },
      {
        name: "title",
        type: "Edm.String" as const,
        searchable: true,
        filterable: false,
        sortable: false,
        retrievable: true,
        analyzerName: "standard.lucene" as const,
      },
      {
        name: "company",
        type: "Edm.String" as const,
        searchable: true,
        filterable: true,
        retrievable: true,
        analyzerName: "standard.lucene" as const,
      },
      {
        name: "description",
        type: "Edm.String" as const,
        searchable: true,
        filterable: false,
        retrievable: true,
        analyzerName: "standard.lucene" as const,
      },
      {
        name: "industry",
        type: "Edm.String" as const,
        searchable: true,
        filterable: true,
        facetable: true,
        retrievable: true,
      },
      {
        name: "industryId",
        type: "Edm.String" as const,
        searchable: false,
        filterable: true,
        facetable: true,
        retrievable: true,
      },
      {
        name: "location",
        type: "Edm.String" as const,
        searchable: true,
        filterable: true,
        facetable: true,
        retrievable: true,
      },
      {
        name: "city",
        type: "Edm.String" as const,
        searchable: false,
        filterable: true,
        facetable: true,
        retrievable: true,
      },
      {
        name: "skillIds",
        type: "Collection(Edm.String)" as const,
        searchable: false,
        filterable: true,
        facetable: true,
        retrievable: true,
      },
      {
        name: "salaryMin",
        type: "Edm.Int32" as const,
        filterable: true,
        sortable: true,
        retrievable: true,
      },
      {
        name: "salaryMax",
        type: "Edm.Int32" as const,
        filterable: true,
        sortable: true,
        retrievable: true,
      },
      {
        name: "minExperienceYears",
        type: "Edm.Int32" as const,
        filterable: true,
        sortable: false,
        retrievable: true,
      },
      {
        name: "maxExperienceYears",
        type: "Edm.Int32" as const,
        filterable: true,
        sortable: false,
        retrievable: true,
      },
      {
        name: "minEducation",
        type: "Edm.String" as const,
        filterable: true,
        retrievable: true,
      },
      {
        name: "type",
        type: "Edm.String" as const,
        filterable: true,
        facetable: true,
        retrievable: true,
      },
      {
        name: "workMode",
        type: "Edm.String" as const,
        filterable: true,
        facetable: true,
        retrievable: true,
      },
      {
        name: "status",
        type: "Edm.String" as const,
        filterable: true,
        retrievable: true,
      },
      {
        name: "postedAt",
        type: "Edm.String" as const,
        filterable: true,
        sortable: true,
        retrievable: true,
      },
      {
        name: "companyId",
        type: "Edm.String" as const,
        filterable: true,
        retrievable: true,
      },
      {
        name: "descriptionVector",
        type: "Collection(Edm.Single)" as const,
        searchable: true,
        retrievable: false,
        vectorSearchDimensions: VECTOR_DIMENSIONS,
        vectorSearchProfileName: VECTOR_PROFILE,
      },
    ],
    vectorSearch: {
      algorithms: [
        {
          name: VECTOR_ALGORITHM,
          kind: "hnsw" as const,
          parameters: {
            m: 4,
            efConstruction: 400,
            efSearch: 500,
            metric: "cosine" as const,
          },
        },
      ],
      profiles: [
        {
          name: VECTOR_PROFILE,
          algorithmConfigurationName: VECTOR_ALGORITHM,
        },
      ],
    },
  };

  let needsRecreate = false;
  try {
    const existing = await indexClient.getIndex(INDEX_NAME);
    const hasVectorField = existing.fields.some(
      (f) => f.name === "descriptionVector",
    );
    if (!hasVectorField) {
      console.log(
        "Existing index has no descriptionVector field; dropping and recreating to add vector support.",
      );
      needsRecreate = true;
    } else {
      console.log("Index exists with vector field; updating definition (createOrUpdate)...");
    }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "statusCode" in err &&
      (err as { statusCode: number }).statusCode === 404
    ) {
      console.log("Index does not exist; creating...");
    } else {
      throw err;
    }
  }

  if (needsRecreate) {
    await indexClient.deleteIndex(INDEX_NAME);
    console.log("Old index deleted.");
  }

  await indexClient.createOrUpdateIndex(indexDef);
  console.log(`\nIndex "${INDEX_NAME}" ready (vector dim=${VECTOR_DIMENSIONS}).`);
  if (needsRecreate) {
    console.log(
      "\nNext steps:\n  1) npx tsx scripts/search-sync.ts        # repopulate scalar fields\n  2) npx tsx scripts/embed-jobs.ts         # populate descriptionVector",
    );
  }
}

main().catch((err) => {
  console.error("\nIndex setup failed:");
  console.error(err);
  process.exit(1);
});

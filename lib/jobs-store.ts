import type { Job } from "./types";
import { unstable_cache } from "next/cache";
import { CONTAINERS, getContainer } from "./db";

export const JOB_CACHE_TAG = "jobs";

export function slugifyCompany(name: string): string {
  return (
    name
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "unknown"
  );
}

function ensureCompanyId(job: Job): Job {
  if (job.companyId) return job;
  return { ...job, companyId: slugifyCompany(job.company) };
}

export async function listJobsAsync(): Promise<Job[]> {
  const container = getContainer(CONTAINERS.jobs);
  const { resources } = await container.items
    .query<Job>({
      query: "SELECT * FROM c ORDER BY c.postedAt DESC",
    })
    .fetchAll();
  return resources.map(ensureCompanyId);
}

export async function getJobByIdAsync(
  id: string,
  companyId?: string,
): Promise<Job | undefined> {
  const fetcher = unstable_cache(
    async (jobId: string, partition?: string): Promise<Job | undefined> => {
      const container = getContainer(CONTAINERS.jobs);
      if (partition) {
        try {
          const { resource } = await container.item(jobId, partition).read<Job>();
          return resource ? ensureCompanyId(resource) : undefined;
        } catch (err: unknown) {
          if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code: number }).code === 404
          ) {
            return undefined;
          }
          throw err;
        }
      }
      const { resources } = await container.items
        .query<Job>({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: jobId }],
        })
        .fetchAll();
      const found = resources[0];
      return found ? ensureCompanyId(found) : undefined;
    },
    ["job-by-id", id, companyId ?? ""],
    {
      tags: [JOB_CACHE_TAG, `job:${id}`],
      revalidate: 3600,
    },
  );
  return fetcher(id, companyId);
}

export async function getJobsByIdsAsync(ids: readonly string[]): Promise<Job[]> {
  if (ids.length === 0) return [];
  const container = getContainer(CONTAINERS.jobs);
  const CHUNK = 50;
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    chunks.push(ids.slice(i, i + CHUNK));
  }
  const results = await Promise.all(
    chunks.map((chunk) => {
      const placeholders = chunk.map((_, idx) => `@id${idx}`).join(", ");
      return container.items
        .query<Job>({
          query: `SELECT * FROM c WHERE c.id IN (${placeholders})`,
          parameters: chunk.map((id, idx) => ({ name: `@id${idx}`, value: id })),
        })
        .fetchAll();
    }),
  );
  return results.flatMap((r) => r.resources.map(ensureCompanyId));
}

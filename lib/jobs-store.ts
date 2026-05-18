import type { Job } from "./types";
import { CONTAINERS, getContainer } from "./db";

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

export async function listOpenJobsAsync(): Promise<Job[]> {
  const container = getContainer(CONTAINERS.jobs);
  const { resources } = await container.items
    .query<Job>({
      query:
        "SELECT * FROM c WHERE c.status != 'closed' OR NOT IS_DEFINED(c.status) ORDER BY c.postedAt DESC",
    })
    .fetchAll();
  return resources.map(ensureCompanyId);
}

export async function getJobByIdAsync(
  id: string,
  companyId?: string,
): Promise<Job | undefined> {
  const container = getContainer(CONTAINERS.jobs);
  // If we know companyId, do a cheap point read.
  if (companyId) {
    try {
      const { resource } = await container.item(id, companyId).read<Job>();
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
      parameters: [{ name: "@id", value: id }],
    })
    .fetchAll();
  const found = resources[0];
  return found ? ensureCompanyId(found) : undefined;
}

export async function getJobsByIdsAsync(ids: readonly string[]): Promise<Job[]> {
  if (ids.length === 0) return [];
  const container = getContainer(CONTAINERS.jobs);
  const out: Job[] = [];
  const CHUNK = 50;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const placeholders = chunk.map((_, idx) => `@id${idx}`).join(", ");
    const { resources } = await container.items
      .query<Job>({
        query: `SELECT * FROM c WHERE c.id IN (${placeholders})`,
        parameters: chunk.map((id, idx) => ({ name: `@id${idx}`, value: id })),
      })
      .fetchAll();
    for (const r of resources) out.push(ensureCompanyId(r));
  }
  return out;
}

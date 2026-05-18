import type { Job, SkillRequirement } from "./types";
import { CONTAINERS, getContainer } from "./db";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

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

export type JobInput = {
  title: string;
  company: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  type: Job["type"];
  industry: string;
  description: string;
  requirements: SkillRequirement[];
};

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

export async function listJobsForCompanyAsync(companyId: string): Promise<Job[]> {
  const container = getContainer(CONTAINERS.jobs);
  const { resources } = await container.items
    .query<Job>({
      query:
        "SELECT * FROM c WHERE c.companyId = @cid ORDER BY c.postedAt DESC",
      parameters: [{ name: "@cid", value: companyId }],
    })
    .fetchAll();
  return resources.map(ensureCompanyId);
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

export async function createJobAsync(input: JobInput): Promise<Job> {
  const job: Job = {
    id: uid("j"),
    companyId: slugifyCompany(input.company),
    ...input,
    postedAt: new Date().toISOString().slice(0, 10),
  };
  const container = getContainer(CONTAINERS.jobs);
  await container.items.create(job);
  return job;
}

export async function updateJobAsync(
  id: string,
  input: JobInput,
): Promise<Job | undefined> {
  const existing = await getJobByIdAsync(id);
  if (!existing) return undefined;
  const updated: Job = {
    ...existing,
    ...input,
    companyId: existing.companyId ?? slugifyCompany(input.company),
  };
  const container = getContainer(CONTAINERS.jobs);
  await container
    .item(updated.id, updated.companyId!)
    .replace(updated);
  return updated;
}

export async function closeJobAsync(id: string): Promise<Job | undefined> {
  const existing = await getJobByIdAsync(id);
  if (!existing) return undefined;
  const updated: Job = {
    ...existing,
    status: "closed",
    closedAt: new Date().toISOString(),
  };
  const container = getContainer(CONTAINERS.jobs);
  await container.item(updated.id, updated.companyId!).replace(updated);
  return updated;
}

export async function reopenJobAsync(id: string): Promise<Job | undefined> {
  const existing = await getJobByIdAsync(id);
  if (!existing) return undefined;
  const updated: Job = {
    ...existing,
    status: "open",
    closedAt: undefined,
  };
  const container = getContainer(CONTAINERS.jobs);
  await container.item(updated.id, updated.companyId!).replace(updated);
  return updated;
}

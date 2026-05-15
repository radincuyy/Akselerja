import { jobs } from "./mock-data";
import type { Job, SkillRequirement } from "./types";

// In-memory mutations on the shared jobs array. Resets on server restart.
// Production: Cosmos DB.

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listJobs(): Job[] {
  return jobs;
}

export function getJobById(id: string): Job | undefined {
  return jobs.find((j) => j.id === id);
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

export function createJob(input: JobInput): Job {
  const job: Job = {
    id: uid("j"),
    ...input,
    postedAt: new Date().toISOString().slice(0, 10),
  };
  jobs.unshift(job);
  return job;
}

export function updateJob(id: string, input: JobInput): Job | undefined {
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return undefined;
  const existing = jobs[idx];
  const updated: Job = {
    ...existing,
    ...input,
  };
  jobs[idx] = updated;
  return updated;
}

export function closeJob(id: string): Job | undefined {
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return undefined;
  jobs[idx] = {
    ...jobs[idx],
    status: "closed",
    closedAt: new Date().toISOString(),
  };
  return jobs[idx];
}

export function reopenJob(id: string): Job | undefined {
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return undefined;
  jobs[idx] = {
    ...jobs[idx],
    status: "open",
    closedAt: undefined,
  };
  return jobs[idx];
}

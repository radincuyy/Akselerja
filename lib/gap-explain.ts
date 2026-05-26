import { CONTAINERS, getContainer, isCosmosConfigured } from "./db";
import type { Job } from "./types";

const CACHE_TTL_HOURS = 24;

type CachedExplanation = {
  id: string;
  key: string;
  text: string;
  createdAt: string;
};

function cacheKey(jobId: string, gapSkillId: string, candidateSkillIds: string[]): string {
  // Profile skills are part of the key so the explanation refreshes when the
  // user adds new skills (the contrast they bridge changes).
  const sorted = [...candidateSkillIds].sort().join(",");
  return `gap-explain:${jobId}:${gapSkillId}:${sorted}`;
}

async function readCache(key: string): Promise<string | null> {
  if (!isCosmosConfigured()) return null;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const { resource } = await container
      .item(key, key)
      .read<CachedExplanation>();
    if (!resource) return null;
    const ageMs = Date.now() - new Date(resource.createdAt).getTime();
    if (ageMs > CACHE_TTL_HOURS * 60 * 60 * 1000) return null;
    return resource.text;
  } catch {
    return null;
  }
}

export async function readCachedGapExplanations(input: {
  job: Job;
  gaps: { skillId: string; name: string }[];
  candidateSkillIds: string[];
  limit?: number;
}): Promise<Map<string, string>> {
  const limit = input.limit ?? 4;
  const slice = input.gaps.slice(0, limit);
  const results = await Promise.all(
    slice.map(async (g) => {
      const cached = await readCache(
        cacheKey(input.job.id, g.skillId, input.candidateSkillIds),
      );
      return cached ? ([g.skillId, cached] as const) : null;
    }),
  );
  return new Map(results.filter((r): r is [string, string] => Boolean(r)));
}

import { CONTAINERS, getContainer, isCosmosConfigured } from "../infra/db";
import { searchYouTubeVideos, type YouTubeVideo } from "./youtube-search";

const CACHE_VERSION = "v2";
const CACHE_TTL_HOURS = 24 * 7;

type CachedYouTube = {
  id: string;
  key: string;
  skillId: string;
  videos: YouTubeVideo[];
  expiresAt: string;
};

function cacheKey(skillId: string): string {
  return `youtube-search:${CACHE_VERSION}:${skillId}`;
}

async function readCache(skillId: string): Promise<YouTubeVideo[] | null> {
  if (!isCosmosConfigured()) return null;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const id = cacheKey(skillId);
    const { resource } = await container.item(id, id).read<CachedYouTube>();
    if (!resource) return null;
    if (new Date(resource.expiresAt).getTime() < Date.now()) return null;
    return resource.videos;
  } catch {
    return null;
  }
}

async function writeCache(
  skillId: string,
  videos: YouTubeVideo[],
): Promise<void> {
  if (!isCosmosConfigured()) return;
  try {
    const container = getContainer(CONTAINERS.aiCache);
    const id = cacheKey(skillId);
    const expiresAt = new Date(
      Date.now() + CACHE_TTL_HOURS * 3600 * 1000,
    ).toISOString();
    const doc: CachedYouTube = {
      id,
      key: id,
      skillId,
      videos,
      expiresAt,
    };
    await container.items.upsert<CachedYouTube>(doc);
  } catch (err) {
    console.warn(
      "[youtube-cache] cache write failed:",
      String(err).slice(0, 120),
    );
  }
}

export async function getYouTubeMaterial(
  skillId: string,
  skillName: string,
): Promise<YouTubeVideo[]> {
  const cached = await readCache(skillId);
  if (cached) return cached;

  try {
    const videos = await searchYouTubeVideos(skillName);
    if (videos.length > 0) {
      await writeCache(skillId, videos);
    }
    return videos;
  } catch (err) {
    console.warn(
      "[youtube-cache] search failed:",
      String(err).slice(0, 120),
    );
    return [];
  }
}

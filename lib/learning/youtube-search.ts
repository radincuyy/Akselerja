export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds?: number;
  viewCount?: number;
};

const SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";

function getApiKey(): string | null {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  return key ? key : null;
}

export function isYouTubeConfigured(): boolean {
  return Boolean(getApiKey());
}

type SearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: {
      medium?: { url?: string };
      default?: { url?: string };
      high?: { url?: string };
    };
  };
};

type SearchResponse = {
  items?: SearchItem[];
  error?: { code?: number; message?: string };
};

type VideoItem = {
  id?: string;
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
};

type VideoListResponse = {
  items?: VideoItem[];
  error?: { code?: number; message?: string };
};

function parseIso8601Duration(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return undefined;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function searchYouTubeVideos(
  skillName: string,
  options: { maxResults?: number } = {},
): Promise<YouTubeVideo[]> {
  const key = getApiKey();
  if (!key) throw new Error("YOUTUBE_API_KEY tidak terkonfigurasi.");
  const maxResults = options.maxResults ?? 5;

  const searchUrl = new URL(SEARCH_ENDPOINT);
  searchUrl.searchParams.set("key", key);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", `${skillName} tutorial`);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("videoDuration", "medium");
  searchUrl.searchParams.set("order", "relevance");
  searchUrl.searchParams.set("maxResults", String(maxResults));
  searchUrl.searchParams.set("safeSearch", "moderate");

  const searchRes = await fetch(searchUrl.toString());
  const searchJson = (await searchRes.json()) as SearchResponse;
  if (!searchRes.ok) {
    const message = searchJson?.error?.message ?? `HTTP ${searchRes.status}`;
    const err = new Error(`YouTube search failed: ${message}`);
    (err as { status?: number }).status = searchRes.status;
    throw err;
  }
  const items = searchJson.items ?? [];
  const videoIds = items
    .map((it) => it.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (videoIds.length === 0) return [];

  const videosUrl = new URL(VIDEOS_ENDPOINT);
  videosUrl.searchParams.set("key", key);
  videosUrl.searchParams.set("part", "contentDetails,statistics");
  videosUrl.searchParams.set("id", videoIds.join(","));
  const videosRes = await fetch(videosUrl.toString());
  const videosJson = (await videosRes.json()) as VideoListResponse;
  if (!videosRes.ok) {
    const message = videosJson?.error?.message ?? `HTTP ${videosRes.status}`;
    console.warn("[youtube-search] videos endpoint failed:", message);
  }
  const detailsById = new Map<string, VideoItem>();
  for (const v of videosJson.items ?? []) {
    if (v.id) detailsById.set(v.id, v);
  }

  const videos: YouTubeVideo[] = [];
  for (const item of items) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    const snippet = item.snippet ?? {};
    const thumb =
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.default?.url ??
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    const detail = detailsById.get(videoId);
    videos.push({
      videoId,
      title: String(snippet.title ?? "").trim(),
      channelTitle: String(snippet.channelTitle ?? "").trim(),
      thumbnailUrl: thumb,
      publishedAt: snippet.publishedAt ?? "",
      durationSeconds: parseIso8601Duration(detail?.contentDetails?.duration),
      viewCount: detail?.statistics?.viewCount
        ? Number(detail.statistics.viewCount)
        : undefined,
    });
  }
  return videos;
}

import { revalidateTag } from "next/cache";
import type { Candidate } from "../shared/types";
import { embedText } from "../ai/gemini-embed";
import { embedTextQwen, isQwenConfigured, shouldFallbackToQwen } from "../ai/qwen-client";
import { CONTAINERS, getContainer } from "../infra/db";
import { profileCacheTag } from "./profile-store";
import { buildProfileEmbedText, categoryHintFromCandidate } from "../ai/embed-text";

export async function refreshProfileVector(userId: string): Promise<void> {
  const container = getContainer(CONTAINERS.candidates);
  try {
    const { resource } = await container.item(userId, userId).read();
    if (!resource) return;
    await refreshProfileVectorFor(resource as Candidate);
  } catch (err) {
    console.error("[profile-summary] refresh failed for", userId, err);
  }
}

export async function refreshProfileVectorFor(profile: Candidate): Promise<void> {
  const userId = profile.id;
  if (!userId) return;
  const container = getContainer(CONTAINERS.candidates);
  try {
    const text = buildProfileEmbedText(profile);
    if (!text) return;

    let vector: number[];
    let provider: "qwen" | "gemini" = "qwen";
    if (isQwenConfigured()) {
      try {
        vector = await embedTextQwen(text);
      } catch (err) {
        if (!shouldFallbackToQwen(err)) throw err;
        vector = await embedText(text, "RETRIEVAL_DOCUMENT");
        provider = "gemini";
      }
    } else {
      vector = await embedText(text, "RETRIEVAL_DOCUMENT");
      provider = "gemini";
    }
    const categoryHint = categoryHintFromCandidate(profile);
    await container.item(userId, userId).patch([
      { op: "set", path: "/profileSummary", value: text },
      { op: "set", path: "/profileVector", value: vector },
      { op: "set", path: "/profileCategoryHint", value: categoryHint },
      { op: "set", path: "/profileEmbedProvider", value: provider },
      { op: "set", path: "/profileVectorUpdatedAt", value: new Date().toISOString() },
    ]);
    revalidateTag(profileCacheTag(userId));
  } catch (err) {
    console.error("[profile-summary] refresh failed for", userId, err);
  }
}

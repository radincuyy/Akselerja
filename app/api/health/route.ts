import { NextResponse } from "next/server";
import { CONTAINERS, getContainer, isCosmosConfigured } from "@/lib/db";
import { isBlobConfigured } from "@/lib/blob-store";
import { isResendConfigured } from "@/lib/resend-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function envBool(...names: string[]): boolean {
  return names.some((n) => Boolean(process.env[n]?.trim()));
}

export async function GET() {
  const checks: Record<string, unknown> = {
    aiSearch: envBool("AZURE_SEARCH_ENDPOINT") && envBool("AZURE_SEARCH_KEY"),
    gemini: envBool("GEMINI_API_KEY"),
    qwen: envBool("QWEN_API_KEY"),
    resend: isResendConfigured(),
    blob: isBlobConfigured(),
    contentSafety:
      envBool("AZURE_CONTENT_SAFETY_ENDPOINT", "AZURE_AI_CONTENT_SAFETY_KEY") &&
      envBool("AZURE_CONTENT_SAFETY_KEY", "AZURE_AI_CONTENT_SAFETY_KEY"),
    youtube: envBool("YOUTUBE_API_KEY"),
  };

  let cosmosOk = false;
  let cosmosLatencyMs: number | null = null;
  if (isCosmosConfigured()) {
    const started = Date.now();
    try {
      await getContainer(CONTAINERS.users)
        .items.query({ query: "SELECT VALUE 1" })
        .fetchNext();
      cosmosOk = true;
    } catch (err) {
      console.error("[health] cosmos probe failed:", String(err).slice(0, 200));
    } finally {
      cosmosLatencyMs = Date.now() - started;
    }
  }
  checks.cosmos = {
    configured: isCosmosConfigured(),
    ok: cosmosOk,
    latencyMs: cosmosLatencyMs,
  };

  const status = cosmosOk ? "ok" : "degraded";
  return NextResponse.json(
    { status, checks, time: new Date().toISOString() },
    {
      status: cosmosOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

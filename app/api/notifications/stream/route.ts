import { auth } from "@/auth";
import { buildNotifications } from "@/lib/notifications";
import {
  listRecentAssessmentAttemptsForUser,
  listRecentPracticeAttemptsForUser,
} from "@/lib/attempts-store";
import { getProfileAsync } from "@/lib/profile-store";

export const runtime = "nodejs";

const STREAM_INTERVAL_MS = 20_000;
const STREAM_MAX_DURATION_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("event: error\ndata: {}\n\n", {
      status: 401,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  const userId = session.user.id;

  const encoder = new TextEncoder();
  let closed = false;
  let interval: ReturnType<typeof setInterval> | null = null;
  let maxLifetime: ReturnType<typeof setTimeout> | null = null;

  function teardown() {
    closed = true;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    if (maxLifetime) {
      clearTimeout(maxLifetime);
      maxLifetime = null;
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      async function push() {
        if (closed) return;
        try {
          const [profile, attempts, practices] = await Promise.all([
            getProfileAsync(userId),
            listRecentAssessmentAttemptsForUser(userId, 1),
            listRecentPracticeAttemptsForUser(userId, 1),
          ]);
          const payload = {
            notifications: buildNotifications({
              hasCv: Boolean(profile?.cv),
              skillCount: profile?.skills?.length ?? 0,
              readinessScore: profile?.readinessScore ?? 0,
              latestAssessment: attempts[0],
              latestPractice: practices[0],
            }),
            updatedAt: new Date().toISOString(),
          };
          controller.enqueue(
            encoder.encode(`event: notifications\ndata: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
        }
      }

      request.signal.addEventListener("abort", () => {
        teardown();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });

      maxLifetime = setTimeout(() => {
        teardown();
        try {
          controller.close();
        } catch {
          // already closed
        }
      }, STREAM_MAX_DURATION_MS);

      await push();
      interval = setInterval(push, STREAM_INTERVAL_MS);
    },
    cancel() {
      teardown();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

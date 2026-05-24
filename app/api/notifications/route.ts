import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildNotifications } from "@/lib/notifications";
import {
  listRecentAssessmentAttemptsForUser,
  listRecentPracticeAttemptsForUser,
} from "@/lib/attempts-store";
import { getProfileAsync } from "@/lib/profile-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [] }, { status: 401 });
  }

  const [profile, attempts, practices] = await Promise.all([
    getProfileAsync(session.user.id),
    listRecentAssessmentAttemptsForUser(session.user.id, 1),
    listRecentPracticeAttemptsForUser(session.user.id, 1),
  ]);
  const notifications = buildNotifications({
    hasCv: Boolean(profile?.cv),
    skillCount: profile?.skills?.length ?? 0,
    readinessScore: profile?.readinessScore ?? 0,
    latestAssessment: attempts[0],
    latestPractice: practices[0],
  });

  return NextResponse.json(
    { notifications, updatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

import { redirect } from "next/navigation";
import { getProfileAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";

// Demo personas use the in-memory mock seed, so they always have a profile
// without writing to Cosmos. Skip the onboarding gate for them.
const DEMO_USER_IDS = new Set(["me", "hr-cipta-1"]);

export default async function CandidateAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  if (user.role === "company") {
    redirect("/hr");
  }

  if (!DEMO_USER_IDS.has(user.id)) {
    const profile = await getProfileAsync(user.id);
    if (!profile) redirect("/onboarding");
  }

  return children;
}

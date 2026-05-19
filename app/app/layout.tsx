import { redirect } from "next/navigation";
import { getProfileAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";

const DEMO_USER_IDS = new Set(["me"]);

export default async function CandidateAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  if (!DEMO_USER_IDS.has(user.id)) {
    const profile = await getProfileAsync(user.id);
    if (!profile) redirect("/onboarding");
  }

  return children;
}

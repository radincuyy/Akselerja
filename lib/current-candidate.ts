import { redirect } from "next/navigation";
import { cache } from "react";
import { getProfileAsync } from "@/lib/profile-store";
import { requireUser, type CurrentUser } from "@/lib/session";
import type { Candidate } from "@/lib/types";

export type CurrentCandidate = {
  user: CurrentUser;
  profile: Candidate;
};

export const getCurrentCandidate = cache(
  async function getCurrentCandidate(): Promise<CurrentCandidate> {
    const user = await requireUser();
    const profile = await getProfileAsync(user.id);
    if (!profile) redirect("/onboarding");
    return { user, profile };
  },
);

import { redirect } from "next/navigation";
import { cache } from "react";
import { getProfileAsync } from "@/lib/profile/profile-store";
import { requireUser, type CurrentUser } from "@/lib/auth/session";
import type { Candidate } from "@/lib/shared/types";

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

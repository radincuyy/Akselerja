import AppShell from "@/components/layout/AppShell";
import { getCurrentCandidate } from "@/lib/profile/current-candidate";

export default async function CandidateAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentCandidate();

  return (
    <AppShell currentUser={user} profile={profile}>
      {children}
    </AppShell>
  );
}

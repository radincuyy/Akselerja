import { redirect } from "next/navigation";
import ProfileEditMount from "@/components/ProfileEditMount";
import { getProfileAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";

type SearchParams = Promise<{ saved?: string; cv?: string }>;

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const me = await getProfileAsync(user.id);
  if (!me) redirect("/onboarding");
  const { saved, cv: cvFlag } = await searchParams;

  return (
    <>
      {saved === "1" ? <SuccessBanner text="Profilmu sudah disimpan." /> : null}
      {cvFlag === "1" ? (
        <SuccessBanner text="Profilmu terupdate dari CV terbaru." />
      ) : null}
      <ProfileEditMount me={me} />
    </>
  );
}

function SuccessBanner({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-3 rounded-lg border border-(--color-teal) bg-(--color-teal-soft) px-4 py-3 text-sm text-(--color-teal-deep)"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5.5 9.5 8 12l4.5-5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="font-medium">{text}</p>
    </div>
  );
}

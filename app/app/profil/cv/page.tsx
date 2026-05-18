import Link from "next/link";
import AppShell from "@/components/AppShell";
import CvUploader from "@/components/CvUploader";
import { getProfileOrSeedAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";

export default async function UpdateCvPage() {
  const user = await requireUser();
  const profile = await getProfileOrSeedAsync(user.id);

  return (
    <AppShell active="/app/profil">
      <Link
        href="/app/profil"
        className="inline-flex items-center gap-1.5 text-sm text-(--color-muted) hover:text-(--color-ink)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M9 4 5 7l4 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Kembali ke profil
      </Link>

      <header className="mt-6 max-w-2xl">
        <p className="text-sm font-medium text-(--color-muted)">
          Profil saya
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
          {profile.cv ? "Update CV" : "Upload CV"}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-(--color-muted)">
          Upload CV terbaru. Kami akan ekstrak skill, pendidikan, dan
          pengalaman, lalu kamu konfirmasi sebelum profilmu diperbarui.
        </p>
      </header>

      <div className="mt-10 max-w-2xl">
        <CvUploader currentCv={profile.cv} />
      </div>
    </AppShell>
  );
}

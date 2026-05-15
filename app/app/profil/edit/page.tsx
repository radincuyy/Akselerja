import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProfileEditForm from "@/components/ProfileEditForm";
import { getProfile } from "@/lib/profile-store";

export default function EditProfilePage() {
  const profile = getProfile();

  return (
    <AppShell variant="candidate" active="/app/profil">
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

      <header className="mt-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
          Profil saya
        </p>
        <h1 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-(--color-ink)">
          Edit profil
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-(--color-muted)">
          Ubah data inti, pendidikan, atau pengalaman kerja. Skill diatur
          otomatis dari hasil assessment dan parsing CV. Untuk memperbarui
          CV,{" "}
          <Link
            href="/app/profil/cv"
            className="font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
          >
            gunakan halaman update CV
          </Link>
          .
        </p>
      </header>

      <ProfileEditForm profile={profile} />
    </AppShell>
  );
}

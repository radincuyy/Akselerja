import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import VisibilityForm from "@/components/VisibilityForm";
import DangerConfirmForm from "@/components/DangerConfirmForm";
import { getProfile, getVisibility } from "@/lib/profile-store";
import { deleteCandidateAccount } from "@/lib/profile-actions";

export default function PengaturanPage() {
  const profile = getProfile();
  const visibility = getVisibility();

  return (
    <AppShell variant="candidate" active="/app/profil">
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan akun"
        description="Kelola cara kamu masuk, siapa yang bisa melihat profil, dan akun. Untuk mengubah isi profil seperti bio, pengalaman, atau CV, buka halaman Profil."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <nav aria-label="Bagian pengaturan" className="space-y-1 lg:sticky lg:top-32 lg:self-start">
          <a
            href="#login"
            className="block rounded-md px-3 py-2 text-sm text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            Login &amp; keamanan
          </a>
          <a
            href="#visibility"
            className="block rounded-md px-3 py-2 text-sm text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            Privasi profil
          </a>
          <a
            href="#bahaya"
            className="block rounded-md px-3 py-2 text-sm text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            Hapus akun
          </a>
        </nav>

        <div className="space-y-12">
          <section id="login" aria-labelledby="login-heading">
            <h2 id="login-heading" className="text-lg font-semibold tracking-tight text-(--color-ink)">
              Login &amp; keamanan
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
              Email yang kamu pakai untuk masuk dan menerima notifikasi dari
              perusahaan. Berbeda dengan email kontak di profil, yang bisa kamu
              atur terpisah lewat halaman Profil.
            </p>
            <div className="mt-5 rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-(--color-muted)">
                Email login
              </p>
              <p className="mt-1 text-base text-(--color-ink)">{profile.email}</p>
              <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                Untuk mengganti email login atau password, gunakan tautan reset
                yang kami kirim ke email tersebut.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/lupa-password"
                  className="rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
                >
                  Ganti password
                </a>
              </div>
            </div>
          </section>

          <section id="visibility" aria-labelledby="visibility-heading">
            <h2 id="visibility-heading" className="text-lg font-semibold tracking-tight text-(--color-ink)">
              Privasi profil
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
              Atur siapa yang bisa melihat profilmu. Default-nya hanya
              perusahaan yang kamu lamar. Buka ke semua perusahaan kalau kamu
              sedang aktif mencari kerja dan terbuka untuk pendekatan dari HR.
            </p>
            <VisibilityForm initial={visibility} />
          </section>

          <section id="bahaya" aria-labelledby="bahaya-heading">
            <h2 id="bahaya-heading" className="text-lg font-semibold tracking-tight text-(--color-ink)">
              Hapus akun
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
              Menghapus akun akan menghilangkan profil, riwayat lamaran, dan
              hasil assessment kamu. Perusahaan yang sudah pernah kamu lamar
              akan melihat catatan bahwa akunmu tidak aktif. Tindakan ini tidak
              bisa dibatalkan.
            </p>
            <div className="mt-5">
              <DangerConfirmForm
                action={deleteCandidateAccount}
                triggerLabel="Hapus akun saya"
                title="Hapus akun secara permanen"
                description="Semua data profil dan riwayat lamaran akan dihapus dari sistem kami dalam 24 jam. Kamu akan keluar setelah konfirmasi."
                confirmKeyword="HAPUS"
                confirmCta="Hapus akun saya"
              />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

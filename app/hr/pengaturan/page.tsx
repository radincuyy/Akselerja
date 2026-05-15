import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import DangerConfirmForm from "@/components/DangerConfirmForm";
import { deleteCompanyAccount } from "@/lib/profile-actions";

export default function HrPengaturanPage() {
  return (
    <AppShell variant="company" active="/hr">
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan perusahaan"
        description="Kelola profil perusahaan, anggota tim, dan akun. Beberapa pengaturan menggunakan default selama Akselerja masih dalam tahap pengembangan."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <nav aria-label="Bagian pengaturan" className="space-y-1 lg:sticky lg:top-32 lg:self-start">
          <a
            href="#perusahaan"
            className="block rounded-md px-3 py-2 text-sm text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            Profil perusahaan
          </a>
          <a
            href="#tim"
            className="block rounded-md px-3 py-2 text-sm text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            Anggota tim
          </a>
          <a
            href="#bahaya"
            className="block rounded-md px-3 py-2 text-sm text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            Hapus akun
          </a>
        </nav>

        <div className="space-y-12">
          <section id="perusahaan" aria-labelledby="perusahaan-heading">
            <h2
              id="perusahaan-heading"
              className="text-lg font-semibold tracking-tight text-(--color-ink)"
            >
              Profil perusahaan
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
              Informasi yang muncul di setiap lowongan kamu. Edit detail
              perusahaan untuk membantu kandidat memahami konteks kerja sebelum
              melamar.
            </p>
            <dl className="mt-5 divide-y divide-(--color-line) rounded-lg border border-(--color-line) bg-(--color-paper)">
              <Row label="Nama" value="PT Cipta Logistik Nusantara" />
              <Row label="Industri" value="Logistik" />
              <Row label="Lokasi kantor" value="Bekasi, Jawa Barat" />
              <Row label="Email kontak HR" value="hrd@ciptalogistik.id" />
            </dl>
            <p className="mt-3 text-xs text-(--color-muted)">
              Edit profil perusahaan tersedia di tahap berikutnya. Hubungi tim
              kami kalau ada perubahan urgent.
            </p>
          </section>

          <section id="tim" aria-labelledby="tim-heading">
            <h2 id="tim-heading" className="text-lg font-semibold tracking-tight text-(--color-ink)">
              Anggota tim
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
              Tambahkan rekan tim agar kalian bisa kelola lowongan dan kandidat
              bersama. Setiap anggota punya akses penuh ke daftar lamaran.
            </p>
            <ul className="mt-5 divide-y divide-(--color-line) rounded-lg border border-(--color-line) bg-(--color-paper)">
              <li className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-(--color-ink)">Kamu</p>
                  <p className="text-xs text-(--color-muted)">HR Recruiter · Admin</p>
                </div>
                <span className="rounded-full bg-(--color-tint) px-2.5 py-0.5 text-xs text-(--color-ink)">
                  Aktif
                </span>
              </li>
            </ul>
            <button
              type="button"
              disabled
              title="Fitur tim multi-user tersedia setelah backend siap."
              className="mt-4 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-muted) disabled:opacity-60"
            >
              + Undang anggota tim
            </button>
          </section>

          <section id="bahaya" aria-labelledby="bahaya-heading">
            <h2 id="bahaya-heading" className="text-lg font-semibold tracking-tight text-(--color-ink)">
              Hapus akun perusahaan
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-(--color-muted)">
              Menghapus akun akan menutup semua lowongan aktif dan menghilangkan
              akses tim ke daftar kandidat. Riwayat lamaran kandidat tetap
              terjaga di akun mereka untuk audit. Tindakan ini tidak bisa
              dibatalkan.
            </p>
            <div className="mt-5">
              <DangerConfirmForm
                action={deleteCompanyAccount}
                triggerLabel="Hapus akun perusahaan"
                title="Hapus akun secara permanen"
                description="Semua lowongan aktif akan ditutup, akses tim dicabut, dan profil perusahaan dihapus dalam 24 jam."
                confirmKeyword="HAPUS"
                confirmCta="Hapus akun perusahaan"
              />
            </div>
            <Link
              href="/hr"
              className="mt-6 inline-flex items-center gap-1 text-sm text-(--color-muted) hover:text-(--color-ink)"
            >
              ← Kembali ke dashboard
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-medium text-(--color-muted)">{label}</dt>
      <dd className="text-sm text-(--color-ink)">{value}</dd>
    </div>
  );
}

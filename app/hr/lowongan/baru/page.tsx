import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import JobForm from "@/components/JobForm";
import { skills } from "@/lib/mock-data";

export default function HrJobNewPage() {
  return (
    <AppShell variant="company" active="/hr/lowongan">
      <Link
        href="/hr/lowongan"
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
        Kembali ke daftar lowongan
      </Link>

      <div className="mt-6">
        <PageHeader
          eyebrow="Lowongan baru"
          title="Pasang lowongan"
          description="Tulis posisi yang kamu butuhkan. Kandidat akan melihat skor kecocokan dan skill gap dari profilnya, jadi pastikan deskripsi cukup spesifik."
        />
      </div>

      <JobForm mode={{ kind: "create" }} skills={skills} />
    </AppShell>
  );
}

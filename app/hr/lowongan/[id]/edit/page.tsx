import { notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import JobForm from "@/components/JobForm";
import { skills } from "@/lib/mock-data";
import { getJobById } from "@/lib/jobs-store";

type Params = Promise<{ id: string }>;

export default async function HrJobEditPage({ params }: { params: Params }) {
  const { id } = await params;
  const job = getJobById(id);
  if (!job) notFound();

  return (
    <AppShell variant="company" active="/hr/lowongan">
      <Link
        href={`/hr/lowongan/${job.id}`}
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
        Kembali ke detail lowongan
      </Link>

      <div className="mt-6">
        <PageHeader
          eyebrow="Edit lowongan"
          title={job.title}
          description="Perubahan akan langsung terlihat di daftar kandidat dan match score."
        />
      </div>

      <JobForm mode={{ kind: "edit", job }} skills={skills} />
    </AppShell>
  );
}

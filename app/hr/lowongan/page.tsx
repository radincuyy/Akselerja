import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { calcMatch, candidates, jobs, formatIdr } from "@/lib/mock-data";

export default function HrJobsPage() {
  return (
    <AppShell variant="company" active="/hr/lowongan">
      <PageHeader
        eyebrow="Lowongan"
        title="Lowongan kamu"
        description="Kelola posting, lihat kandidat, dan tutup lowongan saat sudah diisi."
        action={
          <Link
            href="/hr/lowongan/baru"
            className="rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
          >
            + Pasang lowongan baru
          </Link>
        }
      />

      <div className="mt-8 grid gap-4">
        {jobs.map((job) => {
          const matched = candidates.filter((c) => c.id !== "me");
          const top = matched
            .map((c) => calcMatch(c, job).score)
            .sort((a, b) => b - a)[0] ?? 0;
          return (
            <article
              key={job.id}
              className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <Link
                    href={`/hr/lowongan/${job.id}`}
                    className="text-lg font-semibold tracking-tight text-(--color-ink) hover:text-(--color-teal)"
                  >
                    {job.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-(--color-muted)">
                    {job.location} · {job.type} · {formatIdr(job.salaryMin)}–{formatIdr(job.salaryMax)}
                  </p>
                </div>
                <div className="text-right text-xs text-(--color-muted)">
                  <p>
                    <span className="font-medium tabular-nums text-(--color-ink)">{matched.length}</span> kandidat
                  </p>
                  <p>
                    Top match{" "}
                    <span className="font-medium tabular-nums text-(--color-teal)">{top}%</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-(--color-muted)">
                {job.status === "closed" ? (
                  <span className="rounded-full border border-(--color-line) bg-(--color-paper) px-2.5 py-0.5 text-(--color-muted)">
                    Ditutup
                  </span>
                ) : (
                  <span className="rounded-full bg-(--color-tint) px-2.5 py-0.5 text-(--color-ink)">
                    Aktif
                  </span>
                )}
                <span>Diposting {new Date(job.postedAt).toLocaleDateString("id-ID")}</span>
                <span aria-hidden>·</span>
                <Link
                  href={`/hr/lowongan/${job.id}`}
                  className="font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
                >
                  Kelola kandidat
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}

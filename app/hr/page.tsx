import Link from "next/link";
import AppShell from "@/components/AppShell";
import { calcMatch, candidates, jobs } from "@/lib/mock-data";

export default function HrHome() {
  // For each job, compute candidate stats
  const jobStats = jobs.slice(0, 4).map((job) => {
    const matched = candidates
      .filter((c) => c.id !== "me")
      .map((c) => ({ candidate: c, score: calcMatch(c, job).score }))
      .sort((a, b) => b.score - a.score);
    const ready = matched.filter((m) => m.score >= 70).length;
    const trainable = matched.filter((m) => m.score >= 50 && m.score < 70).length;
    return { job, total: matched.length, ready, trainable, top: matched[0] };
  });

  return (
    <AppShell variant="company" active="/hr">
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--color-muted)">
          Dashboard rekrutmen
        </p>
        <h1 className="mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-tight text-(--color-ink)">
          4 lowongan aktif, 16 kandidat baru minggu ini.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-(--color-muted)">
          Mulai dari lowongan paling membutuhkan kandidat. Match score sudah
          dihitung otomatis untuk setiap kombinasi kandidat-lowongan.
        </p>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Lowongan aktif" value="4" note="lowongan terbuka" />
        <Stat label="Kandidat masuk" value="16" note="7 hari terakhir" />
        <Stat label="Rata-rata match" value="64%" note="naik 4 poin minggu ini" />
      </div>

      <section className="mt-12" aria-labelledby="active-heading">
        <div className="flex items-end justify-between gap-4">
          <h2
            id="active-heading"
            className="text-xl font-semibold tracking-tight text-(--color-ink)"
          >
            Lowongan aktif
          </h2>
          <Link
            href="/hr/lowongan"
            className="text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
          >
            Lihat semua →
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-(--color-line) bg-(--color-paper)">
          <table className="w-full text-left text-sm">
            <thead className="bg-(--color-tint) text-xs uppercase tracking-wider text-(--color-muted)">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Posisi</th>
                <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">Kandidat</th>
                <th scope="col" className="hidden px-5 py-3 font-medium md:table-cell">Top match</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-line)">
              {jobStats.map(({ job, total, ready, trainable, top }) => (
                <tr key={job.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-(--color-ink)">{job.title}</p>
                    <p className="text-xs text-(--color-muted)">{job.location}</p>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <span className="font-medium tabular-nums text-(--color-ink)">
                      {total}
                    </span>
                    <span className="ml-2 text-xs text-(--color-muted)">
                      {ready} siap · {trainable} trainable
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    {top ? (
                      <div>
                        <p className="font-medium text-(--color-ink)">
                          {top.candidate.name}
                        </p>
                        <p className="text-xs text-(--color-muted)">
                          {top.score}% cocok
                        </p>
                      </div>
                    ) : (
                      <span className="text-(--color-muted)">Belum ada</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/hr/lowongan/${job.id}`}
                      className="text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
                    >
                      Lihat kandidat →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2" aria-labelledby="insight-heading">
        <div>
          <h2
            id="insight-heading"
            className="text-xl font-semibold tracking-tight text-(--color-ink)"
          >
            Insight singkat
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Pola dari data lowongan dan kandidatmu, dihitung dari 30 hari terakhir.
          </p>
          <ul className="mt-5 space-y-3">
            <InsightLine
              label="Skill paling dicari"
              value="Excel"
              note="muncul di 4 dari 6 lowongan aktif kamu"
            />
            <InsightLine
              label="Skill gap terbesar"
              value="Warehouse Management System"
              note="3 dari 5 kandidat belum punya"
            />
            <InsightLine
              label="Lokasi kandidat dominan"
              value="Bekasi, Tangerang"
              note="64% kandidat dari dua kota ini"
            />
          </ul>
          <Link
            href="/hr/insight"
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
          >
            Buka insight lengkap →
          </Link>
        </div>

        <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-6">
          <p className="text-sm font-semibold text-(--color-ink)">Tips minggu ini</p>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Lowongan Junior Admin Gudang punya banyak kandidat trainable
            (skor 50–70). Kalau kamu bisa menyediakan training internal 1–2
            minggu, pool kandidat efektifmu naik dua kali lipat.
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-(--color-ink)">
        {value}
      </p>
      {note && <p className="mt-0.5 text-xs text-(--color-muted)">{note}</p>}
    </div>
  );
}

function InsightLine({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <li className="border-b border-(--color-line) pb-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-(--color-ink)">{value}</p>
      <p className="mt-0.5 text-xs text-(--color-muted)">{note}</p>
    </li>
  );
}

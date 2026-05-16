import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

const skillDemand = [
  { name: "Microsoft Excel", count: 4, share: 67 },
  { name: "Komunikasi", count: 4, share: 67 },
  { name: "Ketelitian", count: 3, share: 50 },
  { name: "Inventory Management", count: 2, share: 33 },
  { name: "Customer Service", count: 2, share: 33 },
  { name: "SQL", count: 1, share: 17 },
  { name: "Power BI", count: 1, share: 17 },
];

const skillGaps = [
  { name: "Warehouse Management System", gap: 75 },
  { name: "Power BI", gap: 60 },
  { name: "SQL", gap: 55 },
  { name: "Manufacturing Basics", gap: 40 },
];

const locations = [
  { name: "Bekasi", count: 8 },
  { name: "Jakarta", count: 6 },
  { name: "Tangerang", count: 4 },
  { name: "Surabaya", count: 2 },
];

export default function HrInsightPage() {
  return (
    <AppShell variant="company" active="/hr/insight">
      <PageHeader
        eyebrow="Labor market insight"
        title="Pola dari data lowongan dan kandidatmu"
        description="Insight ini dihitung dari aktivitas 30 hari terakhir di akun perusahaanmu, agar membantu pengambilan keputusan rekrutmen dan pelatihan."
      />

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
            Skill paling diminta di lowonganmu
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Persentase lowongan yang menyebut skill ini sebagai requirement.
          </p>
          <ul className="mt-5 space-y-4">
            {skillDemand.map((s) => (
              <li key={s.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-(--color-ink)">{s.name}</span>
                  <span className="text-(--color-muted)">
                    {s.count} lowongan · {s.share}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-(--color-line)">
                  <div
                    className="h-full rounded-full bg-(--color-teal)"
                    style={{ width: `${s.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
            Skill gap terbesar pada kandidatmu
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Persentase kandidat yang belum punya skill yang diminta lowongan.
            Skill di atas {">50%"} cocok untuk training internal terstruktur.
          </p>
          <ul className="mt-5 space-y-4">
            {skillGaps.map((s) => (
              <li key={s.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-(--color-ink)">{s.name}</span>
                  <span className="text-(--color-muted)">{s.gap}% gap</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-(--color-line)">
                  <div
                    className={
                      s.gap >= 50
                        ? "h-full rounded-full bg-(--color-signal-clay)"
                        : "h-full rounded-full bg-(--color-signal-amber)"
                    }
                    style={{ width: `${s.gap}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
            Distribusi lokasi kandidat
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Total {locations.reduce((sum, l) => sum + l.count, 0)} kandidat dari{" "}
            {locations.length} kota berbeda.
          </p>
          <ul className="mt-5 space-y-4">
            {locations.map((l) => {
              const total = locations.reduce((sum, x) => sum + x.count, 0);
              const share = Math.round((l.count / (total || 1)) * 100);
              return (
                <li key={l.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-(--color-ink)">{l.name}</span>
                    <span className="text-(--color-muted)">
                      {l.count} kandidat · {share}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-(--color-line)">
                    <div
                      className="h-full rounded-full bg-(--color-teal)"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-(--color-ink)">
            Rekomendasi area pelatihan
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--color-muted)">
            Berdasarkan skill gap di atas, dua program training internal yang
            paling efisien untuk dijalankan adalah:
          </p>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2">
            <li className="rounded-md bg-(--color-paper) p-4">
              <p className="text-base font-semibold text-(--color-ink)">
                1. Pengenalan WMS dan Inventory
              </p>
              <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                Menutup gap di 3 dari 4 lowongan operasional.
                Estimasi 2 minggu pelatihan, durasi total 30–40 jam.
              </p>
            </li>
            <li className="rounded-md bg-(--color-paper) p-4">
              <p className="text-base font-semibold text-(--color-ink)">
                2. SQL dan Power BI Dasar
              </p>
              <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                Khusus untuk role data analyst dan business support. Bisa
                dijalankan terpisah, durasi 25–30 jam.
              </p>
            </li>
          </ol>
        </div>
      </section>
    </AppShell>
  );
}

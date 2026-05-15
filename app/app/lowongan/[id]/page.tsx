import { notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ApplyButton from "@/components/ApplyButton";
import ScoreDisplay from "@/components/ScoreDisplay";
import StatusBadge from "@/components/StatusBadge";
import {
  calcMatch,
  courses,
  formatIdr,
  jobs,
  levelLabel,
  me,
  skillById,
} from "@/lib/mock-data";
import { findApplication } from "@/lib/applications-store";

type Params = Promise<{ id: string }>;

export default async function LowonganDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const { score, breakdown } = calcMatch(me, job);
  const existingApplication = findApplication(me.id, job.id);
  const matched = breakdown.filter((b) => b.state === "match");
  const improving = breakdown.filter((b) => b.state === "improve");
  const missing = breakdown.filter((b) => b.state === "missing");

  // Personalized learning path: top 3 courses for missing/improve skills
  const gapSkillIds = [...missing, ...improving].map((b) => b.skillId);
  const learningPath = gapSkillIds
    .map((sid) => courses.find((c) => c.skillId === sid))
    .filter((c): c is (typeof courses)[number] => Boolean(c))
    .slice(0, 4);

  const explanation =
    score >= 75
      ? `Kamu sangat cocok untuk posisi ini. ${matched.length} skill utama sudah sesuai, dan tinggal ${improving.length + missing.length} skill yang bisa kamu tingkatkan untuk peluang lebih besar.`
      : score >= 50
        ? `Kamu cukup cocok untuk posisi ini, tapi ada beberapa skill kunci yang masih perlu ditingkatkan. Lihat rencana belajar di bawah.`
        : `Posisi ini agak jauh dari profil kamu sekarang. Tetap bisa kamu kejar, tapi butuh waktu di skill prioritas dulu.`;

  return (
    <AppShell variant="candidate" active="/app/lowongan">
      <Link
        href="/app/lowongan"
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

      <header className="mt-6">
        <p className="text-sm font-medium text-(--color-muted)">
          {job.industry} · {job.type}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-(--color-ink) sm:text-4xl">
          {job.title}
        </h1>
        <p className="mt-2 text-base text-(--color-muted)">
          {job.company} · {job.location}
        </p>
        <p className="mt-3 text-sm font-medium text-(--color-ink)">
          {formatIdr(job.salaryMin)} – {formatIdr(job.salaryMax)} per bulan
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <section
            aria-labelledby="match-heading"
            className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7"
          >
            <ScoreDisplay
              score={score}
              label="Match score"
              explanation={explanation}
              size="lg"
            />

            <div className="mt-7 space-y-3">
              <h2
                id="match-heading"
                className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
              >
                Rincian kecocokan
              </h2>
              <ul className="divide-y divide-(--color-line) border-y border-(--color-line)">
                {breakdown.map((b) => (
                  <li
                    key={b.skillId}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StateBadge state={b.state} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-(--color-ink)">
                          {b.name}
                        </p>
                        <p className="text-xs text-(--color-muted)">
                          Kamu: {levelLabel(b.have)} · Diminta:{" "}
                          {levelLabel(b.required)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-(--color-ink)">
                        +{b.contribution}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-(--color-muted)">
                        kontribusi
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="path-heading">
            <h2
              id="path-heading"
              className="text-lg font-semibold tracking-tight text-(--color-ink)"
            >
              Rencana belajar untuk posisi ini
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
              Empat langkah konkret yang langsung menutup skill gap di atas.
              Selesaikan satu per satu, match score-mu akan naik bersamaan.
            </p>

            {learningPath.length === 0 ? (
              <p className="mt-6 rounded-md border border-(--color-line) bg-(--color-tint) p-4 text-sm text-(--color-ink)">
                Profilmu sudah memenuhi semua skill yang diminta. Tidak ada
                kursus tambahan yang dibutuhkan untuk posisi ini.
              </p>
            ) : (
              <ol className="mt-6 space-y-3">
                {learningPath.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex gap-4 rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-tint) text-sm font-semibold text-(--color-teal)">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-(--color-ink)">
                        {c.title}
                      </p>
                      <p className="mt-1 text-sm text-(--color-muted)">
                        {c.provider} · {c.durationHours} jam ·{" "}
                        {c.free ? "Gratis" : formatIdr(c.priceIdr ?? 0)}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                        {c.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="mt-8" aria-labelledby="desc-heading">
            <h2
              id="desc-heading"
              className="text-lg font-semibold tracking-tight text-(--color-ink)"
            >
              Tentang posisi ini
            </h2>
            <p className="mt-3 text-base leading-relaxed text-(--color-ink)">
              {job.description}
            </p>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
              Skill yang dibutuhkan
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {job.requirements.map((r) => (
                <li
                  key={r.skillId}
                  className="flex items-center justify-between gap-3 rounded border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm"
                >
                  <span className="text-(--color-ink)">
                    {skillById[r.skillId]?.name}
                  </span>
                  <span className="text-(--color-muted)">
                    {levelLabel(r.required)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
            {existingApplication ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={existingApplication.status} />
                  <p className="text-xs text-(--color-muted)">
                    Dilamar saat skormu {existingApplication.scoreAtApply}%
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-(--color-muted)">
                  {existingApplication.status === "submitted"
                    ? "Lamaranmu sudah masuk. HR biasanya butuh 3 sampai 7 hari untuk merespons."
                    : existingApplication.status === "reviewing"
                      ? "HR sedang membaca profilmu. Pakai waktu ini untuk melengkapi profil atau ikut assessment lain."
                      : existingApplication.status === "invited"
                        ? "Kamu diundang interview. Cek email atau WhatsApp dari perusahaan untuk jadwal."
                        : existingApplication.status === "accepted"
                          ? `Selamat, ${job.company} memutuskan menerima kamu. Lihat detail untuk langkah berikutnya.`
                          : "Untuk lamaran ini kamu belum dipilih. Lihat alasan dan rekomendasi langkah berikutnya."}
                </p>
                <Link
                  href={`/app/lamaran/${existingApplication.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-(--color-teal) bg-(--color-teal-soft) px-5 py-3 text-sm font-semibold text-(--color-teal-deep) hover:bg-(--color-tint)"
                >
                  Lihat status lamaran →
                </Link>
              </div>
            ) : (
              <>
                {job.status === "closed" ? (
                  <div className="rounded-md border border-(--color-line) bg-(--color-tint) p-4 text-sm leading-relaxed text-(--color-muted)">
                    <p className="font-semibold text-(--color-ink)">
                      Lowongan ini sudah ditutup
                    </p>
                    <p className="mt-1">
                      Perusahaan tidak menerima lamaran baru untuk posisi ini.
                      Lihat lowongan lain di daftar utama.
                    </p>
                    <Link
                      href="/app/lowongan"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
                    >
                      Cari lowongan lain →
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-(--color-muted)">
                      {score >= 50
                        ? "Kamu siap melamar. Perusahaan akan melihat profil dan match score yang sama dengan yang kamu lihat di sini."
                        : "Kamu masih bisa melamar, tapi disarankan tutup beberapa skill gap dulu agar peluang lebih besar."}
                    </p>
                    <div className="mt-4">
                      <ApplyButton jobId={job.id} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5 text-sm leading-relaxed text-(--color-muted)">
            <p className="font-semibold text-(--color-ink)">
              Bagaimana skor ini dihitung?
            </p>
            <p className="mt-2">
              Untuk tiap skill yang diminta, kami bandingkan level kamu dengan
              level yang dibutuhkan. Bobot tiap skill ditetapkan oleh perusahaan
              saat memasang lowongan. Skill yang cocok memberi kontribusi
              positif; skill yang belum cocok menjadi langkah berikutnya untuk
              kamu kerjakan. Daftar lengkap kontribusinya ada di Rincian
              kecocokan di sebelah kiri.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function StateBadge({ state }: { state: "match" | "improve" | "missing" }) {
  const config = {
    match: {
      label: "Sudah cocok",
      cls: "bg-(--color-tint) text-(--color-signal-green)",
      icon: (
        <path
          d="M3 7l3 3 5-6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    improve: {
      label: "Perlu ditingkatkan",
      cls: "bg-(--color-tint) text-(--color-signal-amber)",
      icon: (
        <path
          d="M7 11V3M3 6.5 7 3l4 3.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    missing: {
      label: "Belum ada",
      cls: "bg-(--color-tint) text-(--color-signal-clay)",
      icon: <path d="M3 7h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
    },
  }[state];

  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.cls}`}
      aria-label={config.label}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        {config.icon}
      </svg>
    </span>
  );
}

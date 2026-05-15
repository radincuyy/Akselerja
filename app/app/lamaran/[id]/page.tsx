import { notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import StatusTimeline from "@/components/StatusTimeline";
import StatusBadge from "@/components/StatusBadge";
import {
  calcMatch,
  courses,
  formatIdr,
  jobs,
  me,
  skillById,
} from "@/lib/mock-data";
import {
  getApplication,
  markCandidateSeen,
  rejectReasonById,
} from "@/lib/applications-store";

type Params = Promise<{ id: string }>;

export default async function ApplicationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const app = getApplication(id);
  if (!app || app.candidateId !== me.id) notFound();

  // Mark seen so candidate beranda + list dot stops pulsing.
  markCandidateSeen(app.id);

  const job = jobs.find((j) => j.id === app.jobId);
  if (!job) notFound();

  const { score: currentScore, breakdown } = calcMatch(me, job);
  const drift = currentScore - app.scoreAtApply;

  const reason = rejectReasonById(app.rejectReason);
  const gapSkillIds = breakdown
    .filter((b) => b.state !== "match")
    .map((b) => b.skillId);
  const recommendedCourses = gapSkillIds
    .map((sid) => courses.find((c) => c.skillId === sid))
    .filter((c): c is (typeof courses)[number] => Boolean(c))
    .slice(0, 2);

  const similarJobs = jobs
    .filter((j) => j.id !== job.id && j.industry === job.industry)
    .slice(0, 2);

  return (
    <AppShell variant="candidate" active="/app/lamaran">
      <Link
        href="/app/lamaran"
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
        Kembali ke daftar lamaran
      </Link>

      <header className="mt-6">
        <p className="text-sm font-medium text-(--color-muted)">
          Lamaran kamu
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl">
          {job.title}
        </h1>
        <p className="mt-1 text-sm text-(--color-muted)">
          {job.company} <span aria-hidden>·</span> {job.location} <span aria-hidden>·</span>{" "}
          {formatIdr(job.salaryMin)} – {formatIdr(job.salaryMax)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-(--color-muted)">
          <StatusBadge status={app.status} size="sm" />
          <span>
            Dilamar pada skor {app.scoreAtApply}%
            {drift !== 0 ? (
              <span
                className={
                  drift > 0
                    ? "ml-1 text-(--color-signal-green)"
                    : "ml-1 text-(--color-signal-clay)"
                }
              >
                ({drift > 0 ? "+" : ""}
                {drift} sekarang)
              </span>
            ) : null}
          </span>
        </div>
      </header>

      <section
        aria-labelledby="timeline-heading"
        className="mt-10 rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7"
      >
        <h2
          id="timeline-heading"
          className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)"
        >
          Perjalanan lamaran
        </h2>
        <div className="mt-6">
          <StatusTimeline application={app} companyName={job.company} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="next-heading">
        <h2
          id="next-heading"
          className="text-lg font-semibold tracking-tight text-(--color-ink)"
        >
          Langkah berikutnya
        </h2>

        {app.status === "submitted" ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
            HR biasanya butuh 3 sampai 7 hari untuk membaca profil kandidat.
            Pakai waktu ini untuk melengkapi profil, ikut satu assessment lagi,
            atau membuka lowongan lain yang skornya juga tinggi.
          </p>
        ) : null}

        {app.status === "reviewing" ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
            HR sudah membuka profilmu untuk lowongan ini. Sambil menunggu,
            kamu bisa naikkan skormu dengan menyelesaikan kursus singkat di
            halaman belajar. Skor sekarang kamu {currentScore}%.
          </p>
        ) : null}

        {app.status === "invited" ? (
          <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-(--color-muted)">
            <p>
              Kabar baik. {job.company} mengundang kamu interview. Detail jadwal
              dan lokasi akan dikirim langsung dari perusahaan via email atau
              WhatsApp ke kontak yang kamu daftarkan.
            </p>
            <p>
              Untuk siap-siap, buka career coach. Kami bisa bantu kamu menyusun
              cerita pengalaman yang relevan dan menjawab pertanyaan klasik HR.
            </p>
            <Link
              href="/app/coach"
              className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
            >
              Buka career coach
            </Link>
          </div>
        ) : null}

        {app.status === "accepted" ? (
          <div className="mt-3 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
            <p>
              Selamat. {job.company} memutuskan menerima kamu untuk posisi{" "}
              {job.title}. Detail kontrak dan onboarding akan dikoordinasikan
              langsung oleh HR perusahaan.
            </p>
          </div>
        ) : null}

        {app.status === "rejected" ? (
          <div className="mt-3 max-w-2xl space-y-5 text-sm leading-relaxed text-(--color-muted)">
            {reason ? (
              <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
                  Alasan dari {job.company}
                </p>
                <p className="mt-1 text-base font-semibold text-(--color-ink)">
                  {reason.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                  {reason.candidateMessage}
                </p>
              </div>
            ) : (
              <p>
                Untuk lamaran ini, kamu belum dipilih. Bukan berarti profilmu
                buruk; banyak lowongan serupa sedang dibuka. Lihat rekomendasi
                di bawah.
              </p>
            )}

            {(app.rejectReason === "skill-gap" || !app.rejectReason) && recommendedCourses.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-(--color-ink)">
                  Kursus yang menutup skill kunci
                </h3>
                <ul className="mt-3 space-y-3">
                  {recommendedCourses.map((c) => {
                    const skill = skillById[c.skillId];
                    return (
                      <li
                        key={c.id}
                        className="rounded-lg border border-(--color-line) bg-(--color-paper) p-4"
                      >
                        <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal)">
                          {skill?.name ?? "Skill"}
                        </p>
                        <p className="mt-1 text-base font-semibold text-(--color-ink)">
                          {c.title}
                        </p>
                        <p className="mt-1 text-xs text-(--color-muted)">
                          {c.provider} <span aria-hidden>·</span> {c.durationHours} jam{" "}
                          <span aria-hidden>·</span>{" "}
                          {c.free ? "Gratis" : formatIdr(c.priceIdr ?? 0)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href="/app/belajar"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
                >
                  Buka rencana belajar →
                </Link>
              </div>
            ) : null}

            {(app.rejectReason === "experience" || app.rejectReason === "filled" || !app.rejectReason) && similarJobs.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-(--color-ink)">
                  Lowongan serupa di industri {job.industry}
                </h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {similarJobs.map((j) => (
                    <li
                      key={j.id}
                      className="rounded-lg border border-(--color-line) bg-(--color-paper) p-4"
                    >
                      <Link
                        href={`/app/lowongan/${j.id}`}
                        className="text-base font-semibold text-(--color-ink) hover:text-(--color-teal)"
                      >
                        {j.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-(--color-muted)">
                        {j.company} <span aria-hidden>·</span> {j.location}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {app.rejectReason === "location" || app.rejectReason === "salary" ? (
              <Link
                href="/app/lowongan"
                className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
              >
                {app.rejectReason === "location"
                  ? `Lihat lowongan dekat ${me.location.split(",")[0]}`
                  : "Lihat lowongan dengan rentang gajimu"}
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { levelLabel } from "@/lib/format";
import { calcMatch } from "@/lib/match";
import { listJobsAsync } from "@/lib/jobs-store";
import { listCoursesAsync } from "@/lib/courses-store";
import { listPracticeTasksAsync } from "@/lib/practice-store";
import { getProfileOrSeedAsync } from "@/lib/profile-store";
import { requireUser } from "@/lib/session";
import type { Job } from "@/lib/types";

const targetJobId = "j-001";
const nextTargetJobId = "j-007";
const rahmatPracticeSlugs = [
  "admin-gudang-alur-wms-dasar",
  "admin-gudang-receiving-wms",
  "admin-gudang-stock-opname-fifo",
];

type SearchParams = Promise<{ mode?: string; target?: string }>;

function formatGoogleDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function googleCalendarHref({
  title,
  details,
  dayOffset,
  daySpan = 1,
}: {
  title: string;
  details: string;
  dayOffset: number;
  daySpan?: number;
}) {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + daySpan);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function BelajarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { mode, target } = await searchParams;
  const user = await requireUser();
  const me = await getProfileOrSeedAsync(user.id);
  const jobs = await listJobsAsync();
  const courses = await listCoursesAsync();
  const practiceTasks = await listPracticeTasksAsync();
  const targetOverrideJob = target
    ? jobs.find((job) => job.id === target)
    : undefined;
  const isJobSpecificMode = Boolean(targetOverrideJob);
  const isNextMode = mode === "next";
  const baseJob = jobs.find((job) => job.id === targetJobId) ?? jobs[0];
  const nextJob = jobs.find((job) => job.id === nextTargetJobId) ?? baseJob;
  const targetJob = targetOverrideJob ?? (isNextMode ? nextJob : baseJob);
  const { score, breakdown } = calcMatch(me, targetJob);
  const baseMatch = calcMatch(me, baseJob);
  const gaps = breakdown.filter((b) => b.state !== "match");
  const matched = breakdown.filter((b) => b.state === "match");
  const practices = rahmatPracticeSlugs
    .map((slug) => practiceTasks.find((task) => task.slug === slug))
    .filter((task): task is (typeof practiceTasks)[number] => Boolean(task));
  const firstPractice = practices[0] ?? practiceTasks[0];
  const receivingPractice =
    practices.find((task) => task.slug === "admin-gudang-receiving-wms") ??
    firstPractice;
  const stockPractice =
    practices.find((task) => task.slug === "admin-gudang-stock-opname-fifo") ??
    firstPractice;
  const wmsCourse = courses.find((course) => course.skillId === "wms");
  const nearbySeedIds = isJobSpecificMode
    ? [targetJob.id, targetJobId, nextTargetJobId]
    : isNextMode
      ? [targetJob.id, targetJobId, "j-008"]
      : [targetJob.id, "j-002", "j-003"];
  const nearbyMatches = nearbySeedIds
    .map((jobId) => jobs.find((job) => job.id === jobId))
    .filter((job): job is Job => Boolean(job))
    .filter(
      (job, index, list) =>
        list.findIndex((item) => item.id === job.id) === index,
    )
    .map((job) => ({ job, score: calcMatch(me, job).score }))
    .slice(0, 3);

  const gapRoadmap = [
    {
      label: "Hari 1",
      title: "Pahami alur WMS gudang",
      body: "Rahmat sudah punya pengalaman gudang ritel, jadi langkah pertama adalah menerjemahkan pengalaman itu ke proses gudang formal.",
      evidence:
        "Bisa menjelaskan receiving, hold, release, dan data yang masuk ke WMS.",
      href: `/app/belajar/${firstPractice.slug}`,
      action: wmsCourse ? wmsCourse.title : "Materi WMS dasar",
      calendarHref: googleCalendarHref({
        title: "Belajar WMS dasar",
        details:
          "Roadmap Akselerja: pahami receiving, hold, release, dan data WMS untuk Junior Admin Gudang.",
        dayOffset: 0,
      }),
    },
    {
      label: "Hari 2-3",
      title: "Latihan receiving barang",
      body: "Kerjakan kasus PO, barang rusak, dan nomor batch hilang. Ini menutup gap WMS utama untuk Junior Admin Gudang.",
      evidence: "Skor rubrik menunjukkan kepatuhan SOP dan akurasi pencatatan.",
      href: `/app/belajar/${receivingPractice.slug}`,
      action: "Mulai simulasi",
      calendarHref: googleCalendarHref({
        title: "Latihan receiving barang",
        details:
          "Roadmap Akselerja: kerjakan simulasi PO, barang rusak, nomor batch hilang, dan input WMS.",
        dayOffset: 1,
        daySpan: 2,
      }),
    },
    {
      label: "Minggu 1",
      title: "Perkuat inventory formal",
      body: "Skill inventory Rahmat sudah menengah, tapi perlu dibuktikan lewat kasus stock opname dan FIFO.",
      evidence:
        "Bisa memisahkan stok layak jual, barang bermasalah, dan prioritas rotasi.",
      href: "/app/belajar/admin-gudang-stock-opname-fifo",
      action: "Latihan lanjutan",
      calendarHref: googleCalendarHref({
        title: "Latihan stock opname dan FIFO",
        details:
          "Roadmap Akselerja: perkuat inventory formal lewat kasus stock opname dan FIFO/FEFO.",
        dayOffset: 6,
      }),
    },
    {
      label: "Minggu 2",
      title: "Update profil dan lamar",
      body: "Setelah dua latihan selesai, hasil rubrik menjadi bukti kesiapan kerja yang bisa menaikkan confidence saat melamar.",
      evidence:
        "Profil punya bukti praktik WMS dan inventory, bukan hanya daftar skill.",
      href: `/app/lowongan/${targetJob.id}`,
      action: "Lihat lowongan",
      calendarHref: googleCalendarHref({
        title: "Update profil dan lamar Junior Admin Gudang",
        details:
          "Roadmap Akselerja: update bukti praktik WMS dan inventory, lalu cek lowongan target.",
        dayOffset: 13,
      }),
    },
  ];

  const nextRoadmap = [
    {
      label: "Hari 1",
      title: "Naikkan akurasi inventory",
      body: "Rahmat sudah siap untuk admin gudang dasar. Target berikutnya adalah memperkuat inventory agar bisa masuk role Admin Inventory.",
      evidence:
        "Bisa membaca selisih stok, memisahkan barang bermasalah, dan menjelaskan dampaknya ke laporan.",
      href: "/app/belajar/admin-gudang-stock-opname-fifo",
      action: "Latihan inventory",
      calendarHref: googleCalendarHref({
        title: "Latihan inventory untuk Admin Inventory",
        details:
          "Roadmap Akselerja: perkuat inventory formal lewat kasus stock opname dan FIFO/FEFO.",
        dayOffset: 0,
      }),
    },
    {
      label: "Hari 2-4",
      title: "Rapikan laporan stok",
      body: "Fokus ke kebiasaan membuat laporan stok yang bisa dibaca supervisor dan tim operasional.",
      evidence:
        "Bisa menulis catatan selisih, kondisi barang, dan rekomendasi tindak lanjut.",
      href: "/app/belajar/excel-laporan-stok-gudang",
      action: "Latihan tabel stok",
      calendarHref: googleCalendarHref({
        title: "Latihan tabel laporan stok",
        details:
          "Roadmap Akselerja: hitung stok sistem, selisih stok fisik, dan ringkasan supervisor.",
        dayOffset: 1,
        daySpan: 3,
      }),
    },
    {
      label: "Minggu 1",
      title: "Buat bukti praktik",
      body: "Simpan hasil feedback rubrik sebagai bukti bahwa Rahmat bukan hanya punya pengalaman magang, tapi juga bisa mengikuti alur gudang formal.",
      evidence:
        "Profil punya bukti latihan inventory dan feedback rubrik yang bisa dilihat sebelum melamar.",
      href: "/app/profil",
      action: "Update profil",
      calendarHref: googleCalendarHref({
        title: "Update bukti praktik inventory",
        details:
          "Roadmap Akselerja: tambahkan bukti praktik inventory dan feedback rubrik ke profil.",
        dayOffset: 6,
      }),
    },
    {
      label: "Minggu 2",
      title: "Lamar target lanjutan",
      body: "Setelah bukti praktik siap, Rahmat bisa mencoba role Admin Inventory yang masih dekat dengan jalur gudang.",
      evidence:
        "Target berikutnya tidak meloncat terlalu jauh, tapi membuka peluang salary dan tanggung jawab lebih tinggi.",
      href: `/app/lowongan/${nextJob.id}`,
      action: "Lihat target",
      calendarHref: googleCalendarHref({
        title: "Lamar Admin Inventory",
        details:
          "Roadmap Akselerja: cek target lanjutan Admin Inventory setelah bukti praktik siap.",
        dayOffset: 13,
      }),
    },
  ];

  const jobSpecificRoadmap = [
    {
      label: "Hari 1",
      title: "Naikkan WMS ke level perusahaan ini",
      body: "Roadmap WMS dasar sudah selesai, tapi lowongan ini meminta WMS level menengah sehingga Rahmat perlu latihan kasus yang lebih lengkap.",
      evidence:
        "Bisa menangani dokumen tidak lengkap, barang rusak, dan pencatatan WMS tanpa arahan detail.",
      href: `/app/belajar/${receivingPractice.slug}`,
      action: "Review WMS",
      calendarHref: googleCalendarHref({
        title: "Review WMS untuk PT Bina Distribusi Retail",
        details:
          "Roadmap Akselerja: naikkan WMS ke level perusahaan ini lewat simulasi receiving dan input data.",
        dayOffset: 0,
      }),
    },
    {
      label: "Hari 2-3",
      title: "Kenali SAP Inventory",
      body: "Perusahaan ini meminta SAP Inventory dasar. Untuk demo, Rahmat belajar konsep transaksi inventory dan data yang biasanya masuk ke sistem ERP.",
      evidence:
        "Bisa menjelaskan SKU, movement type, quantity, batch, dan alasan koreksi stok.",
      href: `/app/belajar/${stockPractice.slug}`,
      action: "Latihan sistem stok",
      calendarHref: googleCalendarHref({
        title: "Pengenalan SAP Inventory dasar",
        details:
          "Roadmap Akselerja: pahami konsep transaksi inventory dan data stok untuk sistem ERP.",
        dayOffset: 1,
        daySpan: 2,
      }),
    },
    {
      label: "Minggu 1",
      title: "Buat laporan stok harian",
      body: "Judul lowongan sama, tapi perusahaan ini menekankan laporan stok. Latihan utamanya bukan quiz, melainkan tabel kerja.",
      evidence:
        "Bisa menghitung stok sistem, selisih stok fisik, dan catatan tindak lanjut untuk supervisor.",
      href: "/app/belajar/excel-laporan-stok-gudang",
      action: "Latihan tabel stok",
      calendarHref: googleCalendarHref({
        title: "Latihan tabel laporan stok",
        details:
          "Roadmap Akselerja: hitung stok sistem, selisih fisik, dan ringkasan supervisor.",
        dayOffset: 6,
      }),
    },
    {
      label: "Minggu 2",
      title: "Lamar dengan gap spesifik tertutup",
      body: "Setelah WMS, SAP Inventory dasar, dan laporan stok dilatih, Rahmat bisa melamar ke perusahaan ini dengan bukti yang lebih cocok.",
      evidence:
        "Roadmap ini dibuat untuk requirement PT Bina Distribusi Retail, bukan hanya judul Junior Admin Gudang.",
      href: `/app/lowongan/${targetJob.id}`,
      action: "Kembali ke lowongan",
      calendarHref: googleCalendarHref({
        title: "Cek ulang lowongan PT Bina Distribusi Retail",
        details:
          "Roadmap Akselerja: cek kembali requirement setelah latihan tambahan selesai.",
        dayOffset: 13,
      }),
    },
  ];

  const roadmap = isJobSpecificMode
    ? jobSpecificRoadmap
    : isNextMode
      ? nextRoadmap
      : gapRoadmap;
  const pageTitle = isJobSpecificMode
    ? `Roadmap tambahan untuk ${targetJob.title}`
    : isNextMode
      ? `Target berikutnya: ${targetJob.title}`
      : `Roadmap Rahmat menuju ${targetJob.title}`;
  const pageDescription = isJobSpecificMode
    ? `Disusun dari requirement spesifik ${targetJob.company}, bukan hanya dari judul pekerjaan yang sama.`
    : isNextMode
      ? "Rahmat disimulasikan sudah siap untuk Junior Admin Gudang, jadi roadmap berpindah ke role berdekatan yang masih realistis."
      : "Disusun dari profil Rahmat, pengalaman magang gudang ritel, dan gap skill pada lowongan logistik yang paling dekat.";

  return (
    <AppShell active="/app/belajar">
      <PageHeader
        eyebrow="Belajar"
        title={pageTitle}
        description={pageDescription}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={isNextMode ? "/app/belajar" : "/app/belajar?mode=next"}
              className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2.5 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
            >
              {isJobSpecificMode || isNextMode
                ? "Lihat target awal"
                : "Simulasikan target tercapai"}
            </Link>
            <Link
              href={
                isNextMode
                  ? "/app/belajar/admin-gudang-stock-opname-fifo"
                  : isJobSpecificMode
                    ? "/app/belajar/excel-laporan-stok-gudang"
                    : `/app/belajar/${firstPractice.slug}`
              }
              className="inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
            >
              {isJobSpecificMode
                ? "Latihan tabel stok"
                : isNextMode
                  ? "Latihan inventory"
                  : "Mulai gap utama"}
            </Link>
          </div>
        }
      />

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
        <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-6 sm:p-7">
          <p className="text-sm font-medium text-(--color-muted)">
            {isJobSpecificMode
              ? "Target dari lowongan detail"
              : isNextMode
                ? "Target lanjutan"
                : "Target kerja paling dekat"}
          </p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-(--color-ink)">
                {targetJob.title}
              </h2>
              <p className="mt-1 text-sm text-(--color-muted)">
                {targetJob.company} · {targetJob.location}
              </p>
            </div>
            <div className="rounded-lg bg-(--color-tint) px-4 py-3 text-right">
              <p className="text-xs text-(--color-muted)">
                Match score
              </p>
              <p className="text-3xl font-semibold tabular-nums text-(--color-teal)">
                {score}%
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-(--color-ink)">
            {isJobSpecificMode
              ? "Roadmap ini dibuat dari skill yang diminta perusahaan ini: WMS lebih tinggi, SAP Inventory dasar, dan laporan stok. Jadi meski judulnya sama, latihan tetap berbeda."
              : isNextMode
                ? "Karena target awal sudah disimulasikan tercapai, sistem mencari role berdekatan yang masih satu industri dan hanya membutuhkan beberapa penguatan skill."
                : "Rahmat sudah punya dasar Excel, inventory, komunikasi, dan ketelitian. Yang perlu dibuat terlihat adalah pengalaman WMS formal, lalu inventory-nya dibuktikan lewat kasus gudang yang lebih rapi."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SkillGroup
              title="Sudah mendukung"
              items={matched.slice(0, 4)}
              tone="green"
            />
            <SkillGroup title="Perlu ditutup" items={gaps} tone="amber" />
          </div>
          {isNextMode || isJobSpecificMode ? (
            <ArchiveSummary score={baseMatch.score} />
          ) : null}
        </div>

        <div>
          <h2 className="text-sm font-medium text-(--color-muted)">
            Sedang dipelajari
          </h2>
          <div className="mt-4 rounded-lg border border-(--color-line) bg-(--color-paper) p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium text-(--color-teal)">
                Warehouse Management System
              </p>
              <span className="text-xs text-(--color-muted)">Gratis</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-(--color-ink)">
              {isNextMode
                ? "Stock opname singkat dan keputusan FIFO"
                : isJobSpecificMode
                  ? "Latihan tabel laporan stok gudang"
                  : "Pengenalan Warehouse Management System"}
            </h3>
            <p className="mt-1 text-sm text-(--color-muted)">
              {isNextMode || isJobSpecificMode
                ? "Akselerja Practice Lab"
                : "Akselerja Learning · 4 jam"}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-(--color-ink)">
              {isJobSpecificMode
                ? "Latihan kerja berbasis tabel untuk menghitung stok sistem, selisih stok fisik, dan ringkasan supervisor."
                : isNextMode
                  ? "Latihan lanjutan untuk memperkuat inventory formal sebelum Rahmat mencoba role Admin Inventory."
                  : "Dasar-dasar WMS, alur barang dari penerimaan sampai pengiriman, dan praktik di simulator receiving barang."}
            </p>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-(--color-muted)">
                <span>Progress</span>
                <span className="text-(--color-ink)">2 dari 6 modul</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-(--color-line)">
                <div
                  className="h-full rounded-full bg-(--color-teal)"
                  style={{ width: "33%" }}
                />
              </div>
            </div>
            <Link
              href={
                isNextMode
                  ? "/app/belajar/admin-gudang-stock-opname-fifo"
                  : isJobSpecificMode
                    ? "/app/belajar/excel-laporan-stok-gudang"
                    : `/app/belajar/${firstPractice.slug}`
              }
              className="mt-6 inline-flex items-center justify-center rounded-md bg-(--color-teal) px-5 py-2.5 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
            >
              Lanjutkan
            </Link>
          </div>

          <NearbyJobsCard matches={nearbyMatches} />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="roadmap-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="roadmap-heading"
              className="text-xl font-semibold tracking-tight text-(--color-ink)"
            >
              Roadmap belajar 2 minggu
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-(--color-muted)">
              Setiap langkah punya bukti yang bisa dipakai untuk memperbarui
              skill profile dan menjelaskan kesiapan Rahmat ke HR.
            </p>
          </div>
          <span className="text-sm text-(--color-muted)">
            Fokus: WMS dasar + inventory formal
          </span>
        </div>

        <ol className="mt-6 grid gap-4 lg:grid-cols-4">
          {roadmap.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-(--color-tint) px-3 py-1 text-xs font-medium text-(--color-teal)">
                  {step.label}
                </span>
                <span className="text-xs text-(--color-muted)">
                  Langkah {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-(--color-ink)">
                {step.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-(--color-muted)">
                {step.body}
              </p>
              <p className="mt-4 rounded-md bg-(--color-tint) p-3 text-xs leading-relaxed text-(--color-ink)">
                {step.evidence}
              </p>
              {step.href ? (
                <div className="mt-4 grid gap-2">
                  <Link
                    href={step.href}
                    className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
                  >
                    {step.action}
                  </Link>
                  <a
                    href={step.calendarHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md bg-(--color-tint) px-4 py-2 text-sm font-medium text-(--color-muted) hover:text-(--color-ink)"
                  >
                    Tambah ke Google Calendar
                  </a>
                </div>
              ) : (
                <div className="mt-4 grid gap-2">
                  <span className="inline-flex items-center justify-center rounded-md bg-(--color-tint) px-4 py-2 text-sm font-medium text-(--color-muted)">
                    {step.action}
                  </span>
                  <a
                    href={step.calendarHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
                  >
                    Tambah ke Google Calendar
                  </a>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}

function ProfileSignal({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-(--color-paper) px-3 py-1 text-xs font-medium text-(--color-ink)">
      {label}
    </span>
  );
}

function NearbyJobsCard({
  matches,
}: {
  matches: { job: Job; score: number }[];
}) {
  return (
    <section className="mt-4 rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
      <h2 className="text-sm font-medium text-(--color-muted)">
        Lowongan terdekat
      </h2>
      <div className="mt-4 space-y-3">
        {matches.map(({ job, score }) => (
          <Link
            key={job.id}
            href={`/app/lowongan/${job.id}`}
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-md border border-(--color-line) bg-(--color-paper) px-4 py-3.5 transition-colors hover:border-(--color-teal)"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-(--color-ink) group-hover:text-(--color-teal)">
                {job.title}
              </span>
              <span className="mt-1 block truncate text-xs text-(--color-muted)">
                {job.company}
              </span>
            </span>
            <span className="text-sm font-semibold tabular-nums text-(--color-teal)">
              {score}%
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArchiveSummary({ score }: { score: number }) {
  return (
    <Link
      href="/app/belajar/arsip/junior-admin-gudang"
      className="mt-5 block rounded-md border border-(--color-line) bg-(--color-tint) p-4 hover:border-(--color-teal)"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-(--color-muted)">
            Roadmap selesai
          </p>
          <p className="mt-1 text-sm font-medium text-(--color-ink)">
            Junior Admin Gudang · PT Cipta Logistik Nusantara
          </p>
          <p className="mt-1 text-xs text-(--color-muted)">
            3 latihan selesai · bukti WMS dasar dan inventory tersimpan
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-(--color-paper) px-3 py-1 text-xs font-semibold text-(--color-signal-green)">
          Lihat arsip · {Math.max(score, 84)}%
        </span>
      </div>
    </Link>
  );
}

function SkillGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: ReturnType<typeof calcMatch>["breakdown"];
  tone: "green" | "amber";
}) {
  return (
    <div className="rounded-md border border-(--color-line) bg-(--color-tint) p-4">
      <p className="text-xs font-medium text-(--color-muted)">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-(--color-muted)">Tidak ada.</li>
        ) : (
          items.map((item) => (
            <li
              key={item.skillId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
            >
              <span className="text-sm font-medium text-(--color-ink)">
                {item.name}
              </span>
              <LevelStatus item={item} tone={tone} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function LevelStatus({
  item,
  tone,
}: {
  item: ReturnType<typeof calcMatch>["breakdown"][number];
  tone: "green" | "amber";
}) {
  if (item.state === "match") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-(--color-paper) px-2.5 py-1 text-xs font-medium text-(--color-signal-green)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.5 5 9l4.5-5.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Sudah ada
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-(--color-paper) px-2.5 py-1 text-xs font-medium ${
        tone === "green"
          ? "text-(--color-signal-green)"
          : "text-(--color-signal-amber)"
      }`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M3 7.5 6 4l3 3.5M6 4v6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Belum ada
    </span>
  );
}

import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { practiceTasks, skillById } from "@/lib/mock-data";

const completed = [
  {
    slug: "admin-gudang-alur-wms-dasar",
    score: 86,
    finishedAt: "12 Mei 2026",
    answer:
      "Barang datang dicek dengan PO dan surat jalan, lalu kondisi fisik diperiksa sebelum stok dicatat ke WMS.",
    feedback:
      "Alur receiving sudah runtut. Tambahkan contoh reason code agar catatan WMS lebih kuat.",
  },
  {
    slug: "admin-gudang-receiving-wms",
    score: 82,
    finishedAt: "13 Mei 2026",
    answer:
      "SKU-A diterima sebagian, SKU-B diterima penuh, SKU-C ditahan sampai nomor batch diverifikasi.",
    feedback:
      "Keputusan hold sudah tepat. Jawaban bisa ditingkatkan dengan menyebut pihak yang menerima notifikasi.",
  },
  {
    slug: "admin-gudang-stock-opname-fifo",
    score: 84,
    finishedAt: "15 Mei 2026",
    answer:
      "Stok layak jual dipisahkan dari barang penyok dan hampir kedaluwarsa, lalu stok lama diprioritaskan sesuai FIFO/FEFO.",
    feedback:
      "Kontrol kualitas dan rotasi stok sudah jelas. Catatan audit perlu dibuat lebih ringkas.",
  },
];

export const metadata = {
  title: "Arsip Roadmap · Akselerja",
};

export default function JuniorAdminGudangArchivePage() {
  const archivedTasks = completed
    .map((item) => {
      const task = practiceTasks.find(
        (practice) => practice.slug === item.slug,
      );
      return task ? { ...item, task } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const avgScore = Math.round(
    archivedTasks.reduce((sum, item) => sum + item.score, 0) /
      (archivedTasks.length || 1),
  );

  return (
    <AppShell variant="candidate" active="/app/belajar">
      <Link
        href="/app/belajar?mode=next"
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
        Kembali ke target berikutnya
      </Link>

      <div className="mt-6">
        <PageHeader
          eyebrow="Arsip roadmap"
          title="Junior Admin Gudang · PT Cipta Logistik Nusantara"
          description="Riwayat latihan, jawaban terakhir, dan feedback rubrik yang dipakai sebagai bukti kesiapan Rahmat."
          action={
            <div className="rounded-lg bg-(--color-tint) px-4 py-3 text-right">
              <p className="text-xs text-(--color-muted)">
                Rata-rata rubrik
              </p>
              <p className="text-3xl font-semibold tabular-nums text-(--color-teal)">
                {avgScore}%
              </p>
            </div>
          }
        />
      </div>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        {archivedTasks.map(({ task, score, finishedAt, answer, feedback }) => {
          const skill = skillById[task.skillId];
          return (
            <article
              key={task.slug}
              className="flex flex-col rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium text-(--color-teal)">
                  {skill?.name ?? "Skill"}
                </p>
                <span className="rounded-full bg-(--color-tint) px-2.5 py-1 text-xs font-semibold text-(--color-signal-green)">
                  {score}%
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-(--color-ink)">
                {task.title}
              </h2>
              <p className="mt-1 text-xs text-(--color-muted)">
                Selesai {finishedAt}
              </p>

              <div className="mt-5 rounded-md bg-(--color-tint) p-4">
                <p className="text-xs font-medium text-(--color-muted)">
                  Jawaban terakhir
                </p>
                <p className="mt-2 text-sm leading-relaxed text-(--color-ink)">
                  {answer}
                </p>
              </div>

              <div className="mt-4 flex-1 rounded-md border border-(--color-line) p-4">
                <p className="text-xs font-medium text-(--color-muted)">
                  Feedback AI
                </p>
                <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                  {feedback}
                </p>
              </div>

              <Link
                href={`/app/belajar/${task.slug}`}
                className="mt-5 inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-teal) hover:text-(--color-teal)"
              >
                Kerjakan ulang
              </Link>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}

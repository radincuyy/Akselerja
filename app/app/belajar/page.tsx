import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { courses, formatIdr, skillById } from "@/lib/mock-data";

const inProgress = ["c-001"];
const upNext = ["c-002", "c-003"];

export default function BelajarPage() {
  const inProgressCourses = courses.filter((c) => inProgress.includes(c.id));
  const upNextCourses = courses.filter((c) => upNext.includes(c.id));
  const otherCourses = courses.filter(
    (c) => !inProgress.includes(c.id) && !upNext.includes(c.id),
  );

  return (
    <AppShell variant="candidate" active="/app/belajar">
      <PageHeader
        eyebrow="Belajar"
        title="Rencana belajarmu"
        description="Berdasarkan skill gap dari tiga lowongan paling cocok untukmu. Selesaikan satu langkah, match score dan kesiapan kerjamu naik bersamaan."
      />

      <Section title="Sedang dipelajari" courses={inProgressCourses} progress />
      <Section title="Berikutnya untukmu" courses={upNextCourses} />
      <Section title="Pilihan lain yang relevan" courses={otherCourses} muted />
    </AppShell>
  );
}

function Section({
  title,
  courses: list,
  progress,
  muted,
}: {
  title: string;
  courses: typeof courses;
  progress?: boolean;
  muted?: boolean;
}) {
  if (list.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
        {title}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {list.map((c) => {
          const skill = skillById[c.skillId];
          return (
            <article
              key={c.id}
              className={
                muted
                  ? "rounded-lg border border-(--color-line) bg-(--color-tint) p-5"
                  : "rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
              }
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-(--color-teal)">
                  {skill?.name ?? "Skill"}
                </p>
                <span className="text-xs text-(--color-muted)">
                  {c.free ? "Gratis" : formatIdr(c.priceIdr ?? 0)}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-(--color-ink)">
                {c.title}
              </h3>
              <p className="mt-1 text-sm text-(--color-muted)">
                {c.provider} · {c.durationHours} jam
              </p>
              <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                {c.description}
              </p>
              {progress && (
                <div className="mt-4">
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
              )}
              <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)">
                {progress ? "Lanjutkan" : "Mulai"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

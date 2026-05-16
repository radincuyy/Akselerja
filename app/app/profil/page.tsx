import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkillBar from "@/components/SkillBar";
import { assessments, skillById, formatIdr } from "@/lib/mock-data";
import { formatPeriod, getProfile } from "@/lib/profile-store";
import { completedAssessmentIds } from "@/lib/format";

type SearchParams = Promise<{ saved?: string; cv?: string }>;

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const me = getProfile();
  const { saved, cv: cvFlag } = await searchParams;
  const education = me.education ?? [];
  const experience = me.experience ?? [];
  const cv = me.cv;

  const remainingAssessments = assessments.filter(
    (a) => !completedAssessmentIds.has(a.id),
  ).length;
  const hasBio = Boolean(me.bio && me.bio.trim().length >= 30);

  type Suggestion = { text: string; href: string };
  const suggestions: Suggestion[] = [];
  if (experience.length === 0) {
    suggestions.push({
      text: "Tambah satu pengalaman organisasi, magang, atau projek mandiri untuk memperkuat profil.",
      href: "/app/profil/edit#pengalaman",
    });
  }
  if (education.length === 0) {
    suggestions.push({
      text: "Lengkapi riwayat pendidikan supaya HR bisa memfilter posisi yang sesuai.",
      href: "/app/profil/edit#pendidikan",
    });
  }
  if (!hasBio) {
    suggestions.push({
      text: "Tulis 1 sampai 2 kalimat tentang dirimu, supaya HR cepat tangkap konteksmu.",
      href: "/app/profil/edit",
    });
  }
  if (!cv) {
    suggestions.push({
      text: "Upload CV agar profil terisi otomatis dan match score lebih akurat.",
      href: "/app/profil/cv",
    });
  }
  if (remainingAssessments > 0) {
    suggestions.push({
      text: `Selesaikan ${remainingAssessments} assessment lagi untuk skor kesiapan yang lebih akurat.`,
      href: "/app/assessment",
    });
  }

  return (
    <AppShell variant="candidate" active="/app/profil">
      {saved === "1" ? (
        <SuccessBanner text="Profilmu sudah disimpan." />
      ) : null}
      {cvFlag === "1" ? (
        <SuccessBanner text="Profilmu terupdate dari CV terbaru." />
      ) : null}
      <PageHeader
        eyebrow="Profil saya"
        title={me.name}
        description={me.bio}
        action={
          <Link
            href="/app/profil/edit"
            className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
          >
            Edit profil
          </Link>
        }
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="skills-heading">
          <h2
            id="skills-heading"
            className="text-lg font-semibold tracking-tight text-(--color-ink)"
          >
            Skill profile
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
            Skill yang kami catat dari CV dan assessment yang sudah kamu
            selesaikan. Semakin lengkap, semakin akurat rekomendasinya.
          </p>
          <div className="mt-6 space-y-5">
            {me.skills.map((s) => {
              const skill = skillById[s.skillId];
              if (!skill) return null;
              return (
                <SkillBar
                  key={s.skillId}
                  name={skill.name}
                  level={s.level as 1 | 2 | 3}
                />
              );
            })}
          </div>

          <div className="mt-12">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
                Pendidikan
              </h3>
              <Link
                href="/app/profil/edit#pendidikan"
                className="text-xs font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
              >
                Kelola
              </Link>
            </div>
            {education.length === 0 ? (
              <p className="mt-3 rounded-lg border border-(--color-line) bg-(--color-tint) p-4 text-sm leading-relaxed text-(--color-muted)">
                Belum ada riwayat pendidikan. Tambahkan di halaman edit profil.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {education.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
                  >
                    <p className="text-base font-medium text-(--color-ink)">
                      {e.degree}
                    </p>
                    <p className="mt-0.5 text-sm text-(--color-muted)">
                      {e.institution} <span aria-hidden>·</span>{" "}
                      {formatPeriod(e.startMonth, e.endMonth)}
                    </p>
                    {e.notes ? (
                      <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                        {e.notes}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
                Pengalaman kerja
              </h3>
              <Link
                href="/app/profil/edit#pengalaman"
                className="text-xs font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
              >
                Kelola
              </Link>
            </div>
            {experience.length === 0 ? (
              <p className="mt-3 rounded-lg border border-(--color-line) bg-(--color-tint) p-4 text-sm leading-relaxed text-(--color-muted)">
                Belum ada pengalaman kerja. Tambahkan magang, organisasi
                kampus, atau projek mandiri yang related.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {experience.map((x) => (
                  <li
                    key={x.id}
                    className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5"
                  >
                    <p className="text-base font-medium text-(--color-ink)">
                      {x.position}
                    </p>
                    <p className="mt-0.5 text-sm text-(--color-muted)">
                      {x.company} <span aria-hidden>·</span>{" "}
                      {formatPeriod(x.startMonth, x.endMonth)}
                    </p>
                    {x.duties ? (
                      <p className="mt-3 text-sm leading-relaxed text-(--color-ink)">
                        {x.duties}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
              Detail dasar
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-muted)">Lokasi</dt>
                <dd className="text-right text-(--color-ink)">{me.location}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-muted)">Pengalaman</dt>
                <dd className="text-(--color-ink)">
                  {me.experienceYears} tahun
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-muted)">Ekspektasi gaji</dt>
                <dd className="text-(--color-ink)">
                  {formatIdr(me.expectedSalary)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--color-muted)">Email</dt>
                <dd className="text-right text-(--color-ink)">{me.email}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
              CV
            </h3>
            {cv ? (
              <div className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                <p>
                  <span className="font-medium text-(--color-ink)">
                    {cv.filename}
                  </span>
                </p>
                <p className="mt-0.5 text-xs">
                  Diupload {new Date(cv.uploadedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
                Belum ada CV terupload. Upload supaya kami bisa bantu
                mengekstrak profilmu otomatis.
              </p>
            )}
            <Link
              href="/app/profil/cv"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
            >
              {cv ? "Update CV" : "Upload CV"} →
            </Link>
          </div>

          {suggestions.length > 0 ? (
            <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
              <p className="text-sm font-semibold text-(--color-ink)">
                Saran perbaikan profil
              </p>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-(--color-muted)">
                {suggestions.slice(0, 3).map((s) => (
                  <li key={s.href} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-(--color-muted)" />
                    <Link
                      href={s.href}
                      className="hover:text-(--color-ink) hover:underline"
                    >
                      {s.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-(--color-line) bg-(--color-tint) p-5">
              <p className="text-sm font-semibold text-(--color-ink)">
                Profilmu sudah lengkap
              </p>
              <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
                Pengalaman, pendidikan, bio, CV, dan semua assessment sudah
                terisi. Sambil menunggu, kamu bisa lihat lowongan baru atau
                tanya career coach untuk fokus berikutnya.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-(--color-muted)">
              Privasi profil
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">
              Saat ini profilmu hanya terlihat oleh kamu. Kamu bisa membukanya
              ke perusahaan kapan saja dari pengaturan akun.
            </p>
            <Link
              href="/app/pengaturan#visibility"
              className="mt-4 inline-flex items-center justify-center rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
            >
              Atur visibilitas
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function SuccessBanner({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-3 rounded-lg border border-(--color-teal) bg-(--color-teal-soft) px-4 py-3 text-sm text-(--color-teal-deep)"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5.5 9.5 8 12l4.5-5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="font-medium">{text}</p>
    </div>
  );
}

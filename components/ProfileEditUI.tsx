"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { skillById } from "@/lib/skills";
import { formatPeriod } from "@/lib/profile-store";
import {
  saveEducationSection,
  saveExperienceSection,
  savePersonalSection,
  saveSkillsSection,
  type EducationDraft,
  type ExperienceDraft,
  type PersonalInput,
  type SkillDraft,
} from "@/lib/profile-actions";
import type { Candidate } from "@/lib/types";
import CvUploader from "@/components/CvUploader";

type SectionKey = "personal" | "pendidikan" | "pengalaman" | "skills";

const TABS: { id: SectionKey | "cv"; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "pendidikan", label: "Pendidikan" },
  { id: "pengalaman", label: "Pengalaman Kerja" },
  { id: "skills", label: "Skills" },
  { id: "cv", label: "CV" },
];

export default function ProfileEditUI({ me }: { me: Candidate }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<SectionKey | null>(null);
  const [wizardStep, setWizardStep] = useState<number | null>(null);

  function openDrawer(key: SectionKey) {
    setWizardStep(null);
    setDrawer(key);
  }
  function openWizard() {
    setDrawer(null);
    setWizardStep(0);
  }
  function close() {
    setDrawer(null);
    setWizardStep(null);
  }
  function afterSave() {
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-line) pb-2">
        <nav aria-label="Bagian profil">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {TABS.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="inline-block border-b-2 border-transparent py-3 font-medium text-(--color-muted) hover:border-(--color-line) hover:text-(--color-ink)"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          onClick={openWizard}
          className="inline-flex items-center gap-2 rounded-md bg-(--color-teal) px-4 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep)"
        >
          Edit Profil
        </button>
      </div>

      <Section
        id="personal"
        title={me.name || "Tanpa nama"}
        titleSize="display"
        onEdit={() => openDrawer("personal")}
      >
        <div className="mt-4 flex flex-wrap gap-2">
          {me.location ? <ContactChip icon="📍" text={me.location} /> : null}
          {me.email ? <ContactChip icon="✉" text={me.email} /> : null}
          {me.phone ? <ContactChip icon="📞" text={me.phone} /> : null}
          {me.linkedin ? <ContactChip icon="in" text={me.linkedin} /> : null}
          {me.github ? <ContactChip icon="GH" text={me.github} /> : null}
          {me.portfolio ? <ContactChip icon="🌐" text={me.portfolio} /> : null}
        </div>
        {me.bio ? (
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-(--color-muted)">
            {me.bio}
          </p>
        ) : null}
      </Section>

      <Section
        id="pendidikan"
        title="Pendidikan"
        onEdit={() => openDrawer("pendidikan")}
      >
        {(me.education ?? []).length === 0 ? (
          <Empty
            text="Belum ada riwayat pendidikan."
            ctaText="Tambah pendidikan"
            onClick={() => openDrawer("pendidikan")}
          />
        ) : (
          <Timeline>
            {(me.education ?? []).map((e) => (
              <TimelineItem
                key={e.id}
                period={formatPeriod(e.startMonth, e.endMonth)}
              >
                <p className="text-base font-semibold text-(--color-ink)">
                  {e.institution}
                </p>
                <p className="mt-0.5 text-sm text-(--color-muted)">
                  {e.degree}
                  {e.gpa ? ` · IPK ${e.gpa}` : ""}
                </p>
                {e.notes ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-(--color-ink)">
                    {e.notes}
                  </p>
                ) : null}
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Section>

      <Section
        id="pengalaman"
        title="Pengalaman Kerja"
        onEdit={() => openDrawer("pengalaman")}
      >
        {(me.experience ?? []).length === 0 ? (
          <Empty
            text="Belum ada pengalaman kerja."
            ctaText="Tambah pengalaman"
            onClick={() => openDrawer("pengalaman")}
          />
        ) : (
          <Timeline>
            {(me.experience ?? []).map((x) => {
              const bullets = (x.duties ?? "")
                .split(/\r?\n|•/)
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <TimelineItem
                  key={x.id}
                  period={formatPeriod(x.startMonth, x.endMonth)}
                >
                  <p className="text-base font-semibold text-(--color-ink)">
                    {x.position}
                  </p>
                  <p className="mt-0.5 text-sm text-(--color-muted)">
                    {x.company}
                  </p>
                  {bullets.length > 1 ? (
                    <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-(--color-ink)">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span
                            aria-hidden
                            className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-(--color-muted)"
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : bullets.length === 1 ? (
                    <p className="mt-2 text-sm leading-relaxed text-(--color-ink)">
                      {bullets[0]}
                    </p>
                  ) : null}
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </Section>

      <Section id="skills" title="Skills" onEdit={() => openDrawer("skills")}>
        {me.skills.length === 0 ? (
          <Empty
            text="Belum ada skill terdaftar."
            ctaText="Tambah skill"
            onClick={() => openDrawer("skills")}
          />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {me.skills.map((s) => {
              const name = s.name ?? skillById[s.skillId]?.name ?? s.skillId;
              return (
                <li
                  key={s.skillId}
                  className="rounded-full border border-(--color-line) bg-(--color-paper) px-3.5 py-1.5 text-sm font-medium text-(--color-ink)"
                >
                  {name}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <section
        id="cv"
        aria-labelledby="cv-heading"
        className="mt-8 border-t border-(--color-line) pt-8"
      >
        <div className="flex items-center justify-between">
          <h2
            id="cv-heading"
            className="text-base font-semibold tracking-tight text-(--color-ink)"
          >
            CV
          </h2>
          {me.cv ? (
            <span className="text-xs text-(--color-muted)">
              Upload CV baru akan menimpa skill, pendidikan, dan pengalaman dari hasil parse.
            </span>
          ) : null}
        </div>
        <div className="mt-4">
          <CvUploader currentCv={me.cv} />
        </div>
      </section>

      {drawer ? (
        <Drawer title={drawerTitle(drawer)} onClose={close}>
          <DrawerBody
            section={drawer}
            me={me}
            onSaved={() => {
              afterSave();
              close();
            }}
          />
        </Drawer>
      ) : null}

      {wizardStep !== null ? (
        <Wizard
          step={wizardStep}
          onStep={setWizardStep}
          me={me}
          onClose={close}
          onSaved={afterSave}
        />
      ) : null}
    </>
  );
}

function drawerTitle(s: SectionKey): string {
  switch (s) {
    case "personal":
      return "Personal";
    case "pendidikan":
      return "Pendidikan";
    case "pengalaman":
      return "Pengalaman Kerja";
    case "skills":
      return "Skills";
  }
}

function DrawerBody({
  section,
  me,
  onSaved,
}: {
  section: SectionKey;
  me: Candidate;
  onSaved: () => void;
}) {
  if (section === "personal") {
    return (
      <PersonalForm
        initial={toPersonalInitial(me)}
        onSubmit={async (input) => {
          const r = await savePersonalSection(input);
          if (r.ok) onSaved();
          return r;
        }}
        submitLabel="Update"
      />
    );
  }
  if (section === "pendidikan") {
    return (
      <EducationForm
        initial={toEducationInitial(me)}
        onSubmit={async (list) => {
          const r = await saveEducationSection(list);
          if (r.ok) onSaved();
          return r;
        }}
        submitLabel="Update"
      />
    );
  }
  if (section === "pengalaman") {
    return (
      <ExperienceForm
        initial={toExperienceInitial(me)}
        onSubmit={async (list) => {
          const r = await saveExperienceSection(list);
          if (r.ok) onSaved();
          return r;
        }}
        submitLabel="Update"
      />
    );
  }
  return (
    <SkillsForm
      initial={toSkillsInitial(me)}
      onSubmit={async (list) => {
        const r = await saveSkillsSection(list);
        if (r.ok) onSaved();
        return r;
      }}
      submitLabel="Update"
    />
  );
}

function Wizard({
  step,
  onStep,
  me,
  onClose,
  onSaved,
}: {
  step: number;
  onStep: (s: number) => void;
  me: Candidate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const steps: { id: SectionKey; label: string }[] = [
    { id: "personal", label: "Personal" },
    { id: "pendidikan", label: "Pendidikan" },
    { id: "pengalaman", label: "Pengalaman" },
    { id: "skills", label: "Skills" },
  ];
  const current = steps[step];

  function next() {
    if (step < steps.length - 1) onStep(step + 1);
    else onClose();
  }
  function back() {
    if (step > 0) onStep(step - 1);
  }

  return (
    <Modal title={null} onClose={onClose}>
      <div className="border-b border-(--color-line) px-6 pt-5 pb-4 pr-12">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.id} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={
                    done
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-(--color-teal) text-[11px] font-semibold text-(--color-paper-on-teal)"
                      : active
                        ? "flex h-6 w-6 items-center justify-center rounded-full border-2 border-(--color-teal) text-[11px] font-semibold text-(--color-teal)"
                        : "flex h-6 w-6 items-center justify-center rounded-full border border-(--color-line) text-[11px] font-medium text-(--color-muted)"
                  }
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    active
                      ? "font-medium text-(--color-ink)"
                      : "text-(--color-muted)"
                  }
                >
                  {s.label}
                </span>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden h-px w-6 bg-(--color-line) sm:inline-block"
                  />
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm text-(--color-muted)">
          Lengkapi tiap bagian. Perubahan tersimpan saat kamu klik Simpan dan
          lanjut.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {current.id === "personal" && (
          <PersonalForm
            initial={toPersonalInitial(me)}
            onSubmit={async (input) => {
              const r = await savePersonalSection(input);
              if (r.ok) {
                onSaved();
                next();
              }
              return r;
            }}
            submitLabel={
              step === steps.length - 1 ? "Selesai" : "Simpan dan lanjut"
            }
            secondary={step > 0 ? { label: "Kembali", onClick: back } : undefined}
          />
        )}
        {current.id === "pendidikan" && (
          <EducationForm
            initial={toEducationInitial(me)}
            onSubmit={async (list) => {
              const r = await saveEducationSection(list);
              if (r.ok) {
                onSaved();
                next();
              }
              return r;
            }}
            submitLabel={
              step === steps.length - 1 ? "Selesai" : "Simpan dan lanjut"
            }
            secondary={{ label: "Kembali", onClick: back }}
          />
        )}
        {current.id === "pengalaman" && (
          <ExperienceForm
            initial={toExperienceInitial(me)}
            onSubmit={async (list) => {
              const r = await saveExperienceSection(list);
              if (r.ok) {
                onSaved();
                next();
              }
              return r;
            }}
            submitLabel={
              step === steps.length - 1 ? "Selesai" : "Simpan dan lanjut"
            }
            secondary={{ label: "Kembali", onClick: back }}
          />
        )}
        {current.id === "skills" && (
          <SkillsForm
            initial={toSkillsInitial(me)}
            onSubmit={async (list) => {
              const r = await saveSkillsSection(list);
              if (r.ok) {
                onSaved();
                next();
              }
              return r;
            }}
            submitLabel="Selesai"
            secondary={{ label: "Kembali", onClick: back }}
          />
        )}
      </div>
    </Modal>
  );
}

function toPersonalInitial(me: Candidate): PersonalInput {
  return {
    name: me.name ?? "",
    email: me.email ?? "",
    phone: me.phone ?? "",
    location: me.location ?? "",
    bio: me.bio ?? "",
    linkedin: me.linkedin ?? "",
    github: me.github ?? "",
    portfolio: me.portfolio ?? "",
  };
}

function toEducationInitial(me: Candidate): EducationDraft[] {
  return (me.education ?? []).map((e) => ({
    id: e.id,
    institution: e.institution,
    degree: e.degree,
    startMonth: e.startMonth,
    endMonth: e.endMonth,
    gpa: e.gpa,
    notes: e.notes,
  }));
}

function toExperienceInitial(me: Candidate): ExperienceDraft[] {
  return (me.experience ?? []).map((x) => ({
    id: x.id,
    position: x.position,
    company: x.company,
    startMonth: x.startMonth,
    endMonth: x.endMonth,
    duties: x.duties,
  }));
}

function toSkillsInitial(me: Candidate): SkillDraft[] {
  return me.skills.map((s) => ({
    id: s.skillId,
    name: s.name ?? skillById[s.skillId]?.name ?? s.skillId,
  }));
}

function PersonalForm({
  initial,
  onSubmit,
  submitLabel,
  secondary,
}: {
  initial: PersonalInput;
  onSubmit: (input: PersonalInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  submitLabel: string;
  secondary?: { label: string; onClick: () => void };
}) {
  const [data, setData] = useState<PersonalInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ids = useFieldIds(["name", "email", "phone", "location", "bio", "linkedin", "github", "portfolio"]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await onSubmit({
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
        linkedin: data.linkedin,
        github: data.github,
        portfolio: data.portfolio,
      });
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field id={ids.name} label="Nama lengkap" required>
        <input
          id={ids.name}
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          required
        />
      </Field>
      <Field id={ids.email} label="Email" required>
        <input
          id={ids.email}
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          required
        />
      </Field>
      <Field id={ids.phone} label="Nomor telepon">
        <input
          id={ids.phone}
          value={data.phone ?? ""}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          placeholder="+62 812 0000 0000"
        />
      </Field>
      <Field id={ids.location} label="Lokasi" required>
        <input
          id={ids.location}
          value={data.location}
          onChange={(e) => setData({ ...data, location: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          placeholder="Bekasi, Jawa Barat"
          required
        />
      </Field>
      <Field id={ids.linkedin} label="LinkedIn" colSpan="full">
        <input
          id={ids.linkedin}
          value={data.linkedin ?? ""}
          onChange={(e) => setData({ ...data, linkedin: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          placeholder="https://www.linkedin.com/in/..."
        />
      </Field>
      <Field id={ids.github} label="GitHub">
        <input
          id={ids.github}
          value={data.github ?? ""}
          onChange={(e) => setData({ ...data, github: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          placeholder="https://github.com/..."
        />
      </Field>
      <Field id={ids.portfolio} label="Portfolio">
        <input
          id={ids.portfolio}
          value={data.portfolio ?? ""}
          onChange={(e) => setData({ ...data, portfolio: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          placeholder="https://..."
        />
      </Field>
      <Field id={ids.bio} label="Bio singkat" colSpan="full">
        <textarea
          id={ids.bio}
          rows={3}
          value={data.bio}
          onChange={(e) => setData({ ...data, bio: e.target.value })}
          className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
          placeholder="1-2 kalimat tentang dirimu."
        />
      </Field>

      <FormFooter
        error={error}
        pending={pending}
        submitLabel={submitLabel}
        secondary={secondary}
      />
    </form>
  );
}

function EducationForm({
  initial,
  onSubmit,
  submitLabel,
  secondary,
}: {
  initial: EducationDraft[];
  onSubmit: (list: EducationDraft[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  submitLabel: string;
  secondary?: { label: string; onClick: () => void };
}) {
  const [list, setList] = useState<EducationDraft[]>(
    initial.length > 0 ? initial : [emptyEdu()],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update(i: number, patch: Partial<EducationDraft>) {
    setList((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function remove(i: number) {
    setList((prev) => prev.filter((_, idx) => idx !== i));
  }
  function add() {
    setList((prev) => [...prev, emptyEdu()]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await onSubmit(list);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {list.map((e, i) => (
        <div key={i} className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-(--color-ink)">
              Pendidikan {i + 1}
            </h3>
            {list.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Hapus pendidikan"
                className="rounded-md p-1 text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-signal-clay)"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Institusi" required colSpan="full">
              <input
                value={e.institution}
                onChange={(ev) => update(i, { institution: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                required
              />
            </Field>
            <Field label="Jurusan" required>
              <input
                value={e.degree}
                onChange={(ev) => update(i, { degree: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                required
              />
            </Field>
            <Field label="IPK / Nilai">
              <input
                value={e.gpa ?? ""}
                onChange={(ev) => update(i, { gpa: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                placeholder="3.85"
              />
            </Field>
            <Field label="Mulai (YYYY-MM)">
              <input
                value={e.startMonth ?? ""}
                onChange={(ev) => update(i, { startMonth: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                placeholder="2021-08"
              />
            </Field>
            <Field label="Selesai (YYYY-MM)">
              <input
                value={e.endMonth ?? ""}
                onChange={(ev) => update(i, { endMonth: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                placeholder="2024-07 (kosong = sekarang)"
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
      >
        + Tambah pendidikan
      </button>

      <FormFooter
        error={error}
        pending={pending}
        submitLabel={submitLabel}
        secondary={secondary}
      />
    </form>
  );
}

function ExperienceForm({
  initial,
  onSubmit,
  submitLabel,
  secondary,
}: {
  initial: ExperienceDraft[];
  onSubmit: (list: ExperienceDraft[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  submitLabel: string;
  secondary?: { label: string; onClick: () => void };
}) {
  const [list, setList] = useState<ExperienceDraft[]>(
    initial.length > 0 ? initial : [emptyExp()],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update(i: number, patch: Partial<ExperienceDraft>) {
    setList((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function remove(i: number) {
    setList((prev) => prev.filter((_, idx) => idx !== i));
  }
  function add() {
    setList((prev) => [...prev, emptyExp()]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await onSubmit(list);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {list.map((x, i) => (
        <div key={i} className="rounded-lg border border-(--color-line) bg-(--color-paper) p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-(--color-ink)">
              Pengalaman Kerja {i + 1}
            </h3>
            {list.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Hapus pengalaman"
                className="rounded-md p-1 text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-signal-clay)"
              >
                <TrashIcon />
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Posisi" required colSpan="full">
              <input
                value={x.position}
                onChange={(ev) => update(i, { position: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                required
              />
            </Field>
            <Field label="Perusahaan" required colSpan="full">
              <input
                value={x.company}
                onChange={(ev) => update(i, { company: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                required
              />
            </Field>
            <Field label="Mulai (YYYY-MM)">
              <input
                value={x.startMonth ?? ""}
                onChange={(ev) => update(i, { startMonth: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                placeholder="2024-09"
              />
            </Field>
            <Field label="Selesai (YYYY-MM)">
              <input
                value={x.endMonth ?? ""}
                onChange={(ev) => update(i, { endMonth: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                placeholder="kosong = sekarang"
              />
            </Field>
            <Field label="Deskripsi tugas (satu poin per baris)" colSpan="full">
              <textarea
                rows={4}
                value={x.duties ?? ""}
                onChange={(ev) => update(i, { duties: ev.target.value })}
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)/70 focus:border-(--color-teal)"
                placeholder={"Mengelola server berbasis Linux\nMembangun komunitas pemain"}
              />
            </Field>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink)"
      >
        + Tambah pengalaman
      </button>

      <FormFooter
        error={error}
        pending={pending}
        submitLabel={submitLabel}
        secondary={secondary}
      />
    </form>
  );
}

function SkillsForm({
  initial,
  onSubmit,
  submitLabel,
  secondary,
}: {
  initial: SkillDraft[];
  onSubmit: (list: SkillDraft[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  submitLabel: string;
  secondary?: { label: string; onClick: () => void };
}) {
  const [list, setList] = useState<SkillDraft[]>(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    const name = draft.trim();
    if (!name) return;
    const id = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    if (!id) return;
    if (list.some((s) => s.id === id)) {
      setDraft("");
      return;
    }
    setList((prev) => [...prev, { id, name }]);
    setDraft("");
  }

  function remove(id: string) {
    setList((prev) => prev.filter((s) => s.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && draft === "" && list.length > 0) {
      e.preventDefault();
      setList((prev) => prev.slice(0, -1));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await onSubmit(list);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-md border border-(--color-line) bg-(--color-paper) p-2">
        {list.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 rounded-full border border-(--color-line) bg-(--color-tint) py-1 pl-3 pr-1 text-sm text-(--color-ink)"
          >
            {s.name}
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label={`Hapus ${s.name}`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-(--color-muted) hover:bg-(--color-line)"
            >
              <span aria-hidden>×</span>
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tambah skill, tekan Enter"
          className="min-w-[14ch] flex-1 bg-transparent px-2 py-1 text-base text-(--color-ink) outline-none placeholder:text-(--color-muted)"
        />
      </div>
      <p className="text-xs text-(--color-muted)">
        Tekan Enter untuk menambah skill. Skill yang sudah ada di profilmu tetap tersimpan.
      </p>

      <FormFooter
        error={error}
        pending={pending}
        submitLabel={submitLabel}
        secondary={secondary}
      />
    </form>
  );
}

function FormFooter({
  error,
  pending,
  submitLabel,
  secondary,
}: {
  error: string | null;
  pending: boolean;
  submitLabel: string;
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {error ? (
          <p role="alert" className="text-sm text-(--color-signal-clay)">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        {secondary ? (
          <button
            type="button"
            onClick={secondary.onClick}
            disabled={pending}
            className="rounded-md border border-(--color-line) px-4 py-2 text-sm font-medium text-(--color-ink) hover:border-(--color-ink) disabled:opacity-60"
          >
            {secondary.label}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-(--color-teal) px-5 py-2 text-sm font-semibold text-(--color-paper-on-teal) hover:bg-(--color-teal-deep) disabled:opacity-60"
        >
          {pending ? "Menyimpan…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  colSpan,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  colSpan?: "full";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        colSpan === "full"
          ? "flex flex-col gap-1.5 sm:col-span-2"
          : "flex flex-col gap-1.5"
      }
    >
      <label htmlFor={id} className="text-xs font-medium text-(--color-muted)">
        {required ? <span className="text-(--color-signal-clay)">* </span> : null}
        {label}
      </label>
      {children}
    </div>
  );
}

function useFieldIds<T extends string>(keys: T[]): Record<T, string> {
  const base = useId();
  const out = {} as Record<T, string>;
  for (const k of keys) out[k] = `${base}-${k}`;
  return out;
}

function emptyEdu(): EducationDraft {
  return { institution: "", degree: "", startMonth: "", endMonth: "" };
}
function emptyExp(): ExperienceDraft {
  return { position: "", company: "", startMonth: "", endMonth: "" };
}

function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEscapeKey(onClose);
  useBodyScrollLock();
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-(--color-paper) shadow-xl">
        <header className="flex items-center justify-between border-b border-(--color-line) px-6 py-4">
          <h2 className="text-lg font-semibold text-(--color-ink)">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string | null;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEscapeKey(onClose);
  useBodyScrollLock();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-(--color-paper) shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-3 top-3 z-10 rounded-md p-1 text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
        >
          <CloseIcon />
        </button>
        {title ? (
          <header className="border-b border-(--color-line) px-6 py-4">
            <h2 className="text-lg font-semibold text-(--color-ink)">{title}</h2>
          </header>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function useEscapeKey(onEscape: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onEscape();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onEscape]);
}

function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}

function Section({
  id,
  title,
  titleSize = "headline",
  onEdit,
  children,
}: {
  id: string;
  title: string;
  titleSize?: "headline" | "display";
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="border-b border-(--color-line) py-10 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          id={`${id}-heading`}
          className={
            titleSize === "display"
              ? "text-2xl font-semibold tracking-tight text-(--color-ink) sm:text-3xl"
              : "text-xl font-semibold tracking-tight text-(--color-ink)"
          }
        >
          {title}
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--color-muted) hover:bg-(--color-tint) hover:text-(--color-ink)"
          >
            <PencilIcon />
          </button>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ContactChip({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-(--color-line) bg-(--color-paper) px-3 py-1 text-sm text-(--color-ink)">
      <span aria-hidden className="text-(--color-muted)">
        {icon}
      </span>
      <span className="truncate max-w-[18rem]">{text}</span>
    </span>
  );
}

function Timeline({ children }: { children: React.ReactNode }) {
  return <ol className="mt-2 space-y-7">{children}</ol>;
}

function TimelineItem({
  period,
  children,
}: {
  period: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative pl-7">
      <span
        aria-hidden
        className="absolute left-0 top-1.5 h-3 w-3 rounded-full border border-(--color-line) bg-(--color-paper)"
      />
      <span
        aria-hidden
        className="absolute left-[5px] top-5 bottom-[-1.75rem] w-px bg-(--color-line)"
      />
      <p className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
        {period}
      </p>
      <div className="mt-1.5">{children}</div>
    </li>
  );
}

function Empty({
  text,
  ctaText,
  onClick,
}: {
  text: string;
  ctaText: string;
  onClick: () => void;
}) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-(--color-muted)">
      {text}{" "}
      <button
        type="button"
        onClick={onClick}
        className="font-medium text-(--color-teal) hover:text-(--color-teal-deep)"
      >
        {ctaText} →
      </button>
    </p>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5.5 12.5l-3 .5.5-3 8.5-7.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4h10M6 4V2.5h4V4M5 4v9.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

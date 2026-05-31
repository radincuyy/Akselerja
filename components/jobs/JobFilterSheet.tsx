"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { INDUSTRY_OPTIONS } from "@/lib/shared/preferences-options";

type CityFacet = { value: string; count: number };

type Props = {
  cities: CityFacet[];
  defaultCities: string[];
  defaultTypes: string[];
  defaultIndustries: string[];
  defaultModes: string[];
  defaultExperience: string;
  defaultEducation: string;
  defaultSalary: string;
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "Full-time", label: "Penuh Waktu" },
  { value: "Part-time", label: "Paruh Waktu" },
  { value: "Kontrak", label: "Kontrak" },
  { value: "Magang", label: "Magang" },
];

const MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const EXPERIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "fresh", label: "Fresh graduate" },
  { value: "0-1", label: "0-1 tahun" },
  { value: "1-3", label: "1-3 tahun" },
  { value: "3-5", label: "3-5 tahun" },
  { value: "5-10", label: "5-10 tahun" },
  { value: "10+", label: "Lebih dari 10 tahun" },
];

const EDUCATION_OPTIONS: { value: string; label: string }[] = [
  { value: "DOCTORATE", label: "S3" },
  { value: "MASTER_DEGREE", label: "S2" },
  { value: "PROFESSIONAL_EDUCATION", label: "Pendidikan Profesi" },
  { value: "BACHELOR_DEGREE", label: "S1" },
  { value: "DIPLOMA", label: "D1-D4" },
  { value: "HIGH_SCHOOL", label: "SMA/SMK" },
  { value: "SECONDARY_SCHOOL", label: "SMP" },
  { value: "PRIMARY_SCHOOL", label: "SD" },
];

const SALARY_OPTIONS: { value: string; label: string }[] = [
  { value: "0-3", label: "Kurang dari Rp 3 juta" },
  { value: "3-5", label: "Rp 3-5 juta" },
  { value: "5-10", label: "Rp 5-10 juta" },
  { value: "10-20", label: "Rp 10-20 juta" },
  { value: "20+", label: "Lebih dari Rp 20 juta" },
];

const TOP_CITY_COUNT = 8;

type SectionId =
  | "tipe"
  | "lokasi"
  | "industri"
  | "mode"
  | "pengalaman"
  | "pendidikan"
  | "gaji";

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value];
}

export default function JobFilterSheet({
  cities,
  defaultCities,
  defaultTypes,
  defaultIndustries,
  defaultModes,
  defaultExperience,
  defaultEducation,
  defaultSalary,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [cityList, setCityList] = useState<string[]>(defaultCities);
  const [typeList, setTypeList] = useState<string[]>(defaultTypes);
  const [industryList, setIndustryList] = useState<string[]>(defaultIndustries);
  const [modeList, setModeList] = useState<string[]>(defaultModes);
  const [experience, setExperience] = useState(defaultExperience);
  const [education, setEducation] = useState(defaultEducation);
  const [salary, setSalary] = useState(defaultSalary);
  const [showAllCities, setShowAllCities] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    tipe: true,
    pengalaman: true,
    pendidikan: true,
    gaji: true,
    lokasi: true,
    industri: true,
    mode: true,
  });

  const citySearchId = useId();
  const industrySearchId = useId();
  const sectionIdPrefix = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Sync state when server-side defaults change (e.g. URL navigation, redirect
  // pre-fill). Avoid re-set if shallow-equal to prevent input flicker.
  useEffect(() => {
    setCityList((prev) =>
      arraysEqual(prev, defaultCities) ? prev : defaultCities,
    );
    setTypeList((prev) =>
      arraysEqual(prev, defaultTypes) ? prev : defaultTypes,
    );
    setIndustryList((prev) =>
      arraysEqual(prev, defaultIndustries) ? prev : defaultIndustries,
    );
    setModeList((prev) =>
      arraysEqual(prev, defaultModes) ? prev : defaultModes,
    );
    setExperience(defaultExperience);
    setEducation(defaultEducation);
    setSalary(defaultSalary);
  }, [
    defaultCities,
    defaultTypes,
    defaultIndustries,
    defaultModes,
    defaultExperience,
    defaultEducation,
    defaultSalary,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  function commit(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/app/lowongan?${qs}` : "/app/lowongan");
    });
  }

  function commitMulti(key: string, list: string[]) {
    commit(key, list.join(","));
  }

  function toggleCity(value: string) {
    const next = toggleValue(cityList, value);
    setCityList(next);
    commitMulti("lokasi", next);
  }
  function toggleType(value: string) {
    const next = toggleValue(typeList, value);
    setTypeList(next);
    commitMulti("tipe", next);
  }
  function toggleIndustry(value: string) {
    const next = toggleValue(industryList, value);
    setIndustryList(next);
    commitMulti("industri", next);
  }
  function toggleMode(value: string) {
    const next = toggleValue(modeList, value);
    setModeList(next);
    commitMulti("mode", next);
  }

  function pickExperience(v: string) {
    setExperience(v);
    commit("pengalaman", v);
  }
  function pickEducation(v: string) {
    setEducation(v);
    commit("pendidikan", v);
  }
  function pickSalary(v: string) {
    setSalary(v);
    commit("gaji", v);
  }

  function resetAll() {
    setCityList([]);
    setTypeList([]);
    setIndustryList([]);
    setModeList([]);
    setExperience("");
    setEducation("");
    setSalary("");
    const params = new URLSearchParams(searchParams);
    params.delete("lokasi");
    params.delete("tipe");
    params.delete("industri");
    params.delete("mode");
    params.delete("pengalaman");
    params.delete("pendidikan");
    params.delete("gaji");
    params.delete("page");
    params.set("clear", "1");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/app/lowongan?${qs}` : "/app/lowongan");
    });
    setIsOpen(false);
  }

  function toggleSection(id: SectionId) {
    setOpenSections((s) => ({ ...s, [id]: !s[id] }));
  }

  const activeCount =
    cityList.length +
    typeList.length +
    industryList.length +
    modeList.length +
    (experience ? 1 : 0) +
    (education ? 1 : 0) +
    (salary ? 1 : 0);
  const topCities = cities.slice(0, TOP_CITY_COUNT);
  const restCities = cities.slice(TOP_CITY_COUNT);
  const filteredRest = citySearch
    ? restCities.filter((c) =>
        c.value.toLowerCase().includes(citySearch.toLowerCase()),
      )
    : restCities;
  const visibleRest = showAllCities || citySearch ? filteredRest : [];

  const filteredIndustries = industrySearch
    ? INDUSTRY_OPTIONS.filter((i) =>
        i.toLowerCase().includes(industrySearch.toLowerCase()),
      )
    : INDUSTRY_OPTIONS;

  const filterPanel = (
    <div
      className={`flex min-h-0 flex-1 flex-col motion-safe:transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
      aria-busy={isPending || undefined}
    >
      <div className="flex items-center justify-between border-b border-(--color-line) px-5 py-4 lg:hidden">
        <h2 className="text-base font-semibold tracking-tight text-(--color-ink)">
          Filter
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setIsOpen(false)}
          className="-m-2 p-2 text-(--color-muted) hover:text-(--color-ink)"
          aria-label="Tutup filter"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M4 4l10 10M14 4 4 14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5 lg:px-5">
        <FilterSection
          id="tipe"
          title="Tipe pekerjaan"
          isOpen={openSections.tipe}
          onToggle={toggleSection}
          hasActive={typeList.length > 0}
          idPrefix={sectionIdPrefix}
        >
          <div className="space-y-1.5">
            {TYPE_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt.value}
                label={opt.label}
                checked={typeList.includes(opt.value)}
                onChange={() => toggleType(opt.value)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection
          id="mode"
          title="Mode kerja"
          isOpen={openSections.mode}
          onToggle={toggleSection}
          hasActive={modeList.length > 0}
          idPrefix={sectionIdPrefix}
        >
          <div className="space-y-1.5">
            {MODE_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt.value}
                label={opt.label}
                checked={modeList.includes(opt.value)}
                onChange={() => toggleMode(opt.value)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection
          id="pengalaman"
          title="Pengalaman"
          isOpen={openSections.pengalaman}
          onToggle={toggleSection}
          hasActive={Boolean(experience)}
          idPrefix={sectionIdPrefix}
        >
          <div className="space-y-1.5">
            <RadioRow
              name="job-experience"
              label="Semua pengalaman"
              checked={!experience}
              onChange={() => pickExperience("")}
            />
            {EXPERIENCE_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                name="job-experience"
                label={opt.label}
                checked={experience === opt.value}
                onChange={() => pickExperience(opt.value)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection
          id="pendidikan"
          title="Pendidikan minimal"
          isOpen={openSections.pendidikan}
          onToggle={toggleSection}
          hasActive={Boolean(education)}
          idPrefix={sectionIdPrefix}
        >
          <div className="space-y-1.5">
            <RadioRow
              name="job-education"
              label="Semua jenjang"
              checked={!education}
              onChange={() => pickEducation("")}
            />
            {EDUCATION_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                name="job-education"
                label={opt.label}
                checked={education === opt.value}
                onChange={() => pickEducation(opt.value)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection
          id="gaji"
          title="Rentang gaji"
          isOpen={openSections.gaji}
          onToggle={toggleSection}
          hasActive={Boolean(salary)}
          idPrefix={sectionIdPrefix}
        >
          <div className="space-y-1.5">
            <RadioRow
              name="job-salary"
              label="Semua rentang"
              checked={!salary}
              onChange={() => pickSalary("")}
            />
            {SALARY_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                name="job-salary"
                label={opt.label}
                checked={salary === opt.value}
                onChange={() => pickSalary(opt.value)}
              />
            ))}
            <p className="mt-2 px-2 text-xs text-(--color-muted)">
              Lowongan tanpa info gaji disembunyikan saat filter ini aktif.
            </p>
          </div>
        </FilterSection>

        <FilterSection
          id="industri"
          title="Industri"
          isOpen={openSections.industri}
          onToggle={toggleSection}
          hasActive={industryList.length > 0}
          idPrefix={sectionIdPrefix}
        >
          <div className="space-y-2.5">
            {INDUSTRY_OPTIONS.length > 8 ? (
              <>
                <label htmlFor={industrySearchId} className="sr-only">
                  Cari industri
                </label>
                <input
                  id={industrySearchId}
                  type="search"
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  placeholder="Cari industri"
                  className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal) focus:outline-none focus:ring-2 focus:ring-(--color-teal)/30"
                />
              </>
            ) : null}
            <div className="space-y-1">
              {filteredIndustries.length === 0 ? (
                <p className="px-2 py-1 text-xs text-(--color-muted)">
                  Tidak ada industri yang cocok.
                </p>
              ) : (
                filteredIndustries.map((value) => (
                  <CheckboxRow
                    key={value}
                    label={value}
                    checked={industryList.includes(value)}
                    onChange={() => toggleIndustry(value)}
                    dense
                  />
                ))
              )}
            </div>
          </div>
        </FilterSection>

        <FilterSection
          id="lokasi"
          title="Lokasi"
          isOpen={openSections.lokasi}
          onToggle={toggleSection}
          hasActive={cityList.length > 0}
          idPrefix={sectionIdPrefix}
        >
          <div className="space-y-1.5">
            {topCities.map((c) => (
              <CheckboxRow
                key={c.value}
                label={c.value}
                hint={`${c.count} lowongan`}
                checked={cityList.includes(c.value)}
                onChange={() => toggleCity(c.value)}
              />
            ))}
          </div>

          {restCities.length > 0 ? (
            <div className="mt-3 border-t border-(--color-line) pt-3">
              {showAllCities || citySearch ? (
                <div className="space-y-2.5">
                  <label htmlFor={citySearchId} className="sr-only">
                    Cari kota
                  </label>
                  <input
                    id={citySearchId}
                    type="search"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Cari kota lain"
                    className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink) placeholder:text-(--color-muted) focus:border-(--color-teal) focus:outline-none focus:ring-2 focus:ring-(--color-teal)/30"
                  />
                  <div className="space-y-1">
                    {visibleRest.length === 0 ? (
                      <p className="px-2 py-1 text-xs text-(--color-muted)">
                        Tidak ada kota yang cocok.
                      </p>
                    ) : (
                      visibleRest.map((c) => (
                        <CheckboxRow
                          key={c.value}
                          label={c.value}
                          hint={`${c.count}`}
                          checked={cityList.includes(c.value)}
                          onChange={() => toggleCity(c.value)}
                          dense
                        />
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllCities(false);
                      setCitySearch("");
                    }}
                    className="text-xs font-medium text-(--color-muted) hover:text-(--color-ink)"
                  >
                    Sembunyikan
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAllCities(true)}
                  className="text-sm font-medium text-(--color-teal-deep) hover:text-(--color-teal)"
                >
                  Lihat {restCities.length} kota lain
                </button>
              )}
            </div>
          ) : null}
        </FilterSection>
      </div>

      {activeCount > 0 ? (
        <div className="border-t border-(--color-line) px-5 py-3">
          <button
            type="button"
            onClick={resetAll}
            className="text-sm font-medium text-(--color-muted) hover:text-(--color-ink)"
          >
            Reset semua filter
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-(--color-line) bg-(--color-paper) px-4 text-sm font-medium text-(--color-ink) lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M2 4h10M3.5 7h7M5 10h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filter
        {activeCount > 0 ? (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-teal) px-1.5 text-xs font-semibold text-(--color-paper-on-teal)">
            {activeCount}
          </span>
        ) : null}
      </button>

      <aside
        aria-labelledby="filter-heading"
        className="hidden w-72 shrink-0 flex-col rounded-lg border border-(--color-line) bg-(--color-paper) lg:flex lg:max-h-full"
      >
        <header className="border-b border-(--color-line) px-5 py-4">
          <h2
            id="filter-heading"
            className="text-base font-semibold tracking-tight text-(--color-ink)"
          >
            Filter
          </h2>
          <p className="mt-1 text-xs text-(--color-muted)">
            {activeCount === 0
              ? "Semua lowongan diperlihatkan"
              : `${activeCount} filter aktif`}
          </p>
        </header>
        {filterPanel}
      </aside>

      {isOpen ? (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-40 bg-(--color-ink)/40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-mobile-heading"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-(--color-paper) shadow-2xl lg:hidden"
          >
            <span id="filter-mobile-heading" className="sr-only">
              Filter lowongan
            </span>
            {filterPanel}
          </div>
        </>
      ) : null}
    </>
  );
}

function FilterSection({
  id,
  title,
  isOpen,
  onToggle,
  hasActive,
  idPrefix,
  children,
}: {
  id: SectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: SectionId) => void;
  hasActive: boolean;
  idPrefix: string;
  children: React.ReactNode;
}) {
  const headingId = `${idPrefix}-${id}-heading`;
  const panelId = `${idPrefix}-${id}-panel`;
  return (
    <section role="group" aria-labelledby={headingId} className="mt-6 first:mt-0">
      <button
        id={headingId}
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-(--color-muted)">
            {title}
          </span>
          {hasActive ? (
            <span
              aria-label="Filter aktif di kategori ini"
              className="h-1.5 w-1.5 rounded-full bg-(--color-teal)"
            />
          ) : null}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className={`shrink-0 text-(--color-muted) motion-safe:transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M3 5.5 7 9.5l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div id={panelId} hidden={!isOpen} className="mt-3">
        {children}
      </div>
    </section>
  );
}

function RadioRow({
  name,
  label,
  hint,
  checked,
  onChange,
  dense,
}: {
  name: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
  dense?: boolean;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-center justify-between gap-3 rounded-md ${
        dense ? "px-2 py-1.5" : "px-2 py-2"
      } ${
        checked
          ? "bg-(--color-tint) text-(--color-ink)"
          : "text-(--color-ink) hover:bg-(--color-tint)"
      } focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-teal)`}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "border-(--color-teal) bg-(--color-paper)"
              : "border-(--color-line) bg-(--color-paper) group-hover:border-(--color-muted)"
          }`}
        >
          {checked ? (
            <span className="block h-1.5 w-1.5 rounded-full bg-(--color-teal)" />
          ) : null}
        </span>
        <span className="text-sm">{label}</span>
      </span>
      {hint ? (
        <span className="text-xs tabular-nums text-(--color-muted)">{hint}</span>
      ) : null}
    </label>
  );
}

function CheckboxRow({
  label,
  hint,
  checked,
  onChange,
  dense,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
  dense?: boolean;
}) {
  return (
    <label
      className={`group flex cursor-pointer items-center justify-between gap-3 rounded-md ${
        dense ? "px-2 py-1.5" : "px-2 py-2"
      } ${
        checked
          ? "bg-(--color-tint) text-(--color-ink)"
          : "text-(--color-ink) hover:bg-(--color-tint)"
      } focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-teal)`}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
            checked
              ? "border-(--color-teal) bg-(--color-teal)"
              : "border-(--color-line) bg-(--color-paper) group-hover:border-(--color-muted)"
          }`}
        >
          {checked ? (
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className="text-(--color-paper-on-teal)"
              aria-hidden
            >
              <path
                d="M2 5l2 2 4-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        <span className="text-sm">{label}</span>
      </span>
      {hint ? (
        <span className="text-xs tabular-nums text-(--color-muted)">{hint}</span>
      ) : null}
    </label>
  );
}

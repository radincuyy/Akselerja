import type { Candidate, Job } from "./types";
import type { MatchResult } from "./match";

export type MatchReason = {
  /**
   * One short sentence summarizing why this job is a strong fit. Empty when
   * there are no positive signals (e.g. zero skill overlap and every
   * preference mismatched).
   */
  positive: string;
  /**
   * One short sentence on what's holding the score down. Empty when the
   * profile satisfies every positive signal.
   */
  negative: string;
};

const TYPE_LABEL_ID: Record<string, string> = {
  "Full-time": "full-time",
  "Part-time": "part-time",
  Kontrak: "kontrak",
  Magang: "magang",
};

const MODE_LABEL_ID: Record<string, string> = {
  onsite: "onsite",
  hybrid: "hybrid",
  remote: "remote",
};

function shortCity(location: string): string {
  return (location ?? "").split(",")[0].trim();
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function joinList(parts: string[], max = 2): string {
  const trimmed = parts.slice(0, max);
  if (trimmed.length === 0) return "";
  if (trimmed.length === 1) return trimmed[0];
  return `${trimmed.slice(0, -1).join(", ")} dan ${trimmed[trimmed.length - 1]}`;
}

/**
 * Compose a two-line, plain-Indonesian explanation for a match score using
 * data we already have on hand: skill breakdown + candidate preferences. No
 * AI calls; safe to render hundreds of cards per page without latency.
 */
export function buildMatchReason(
  candidate: Candidate,
  job: Job,
  match: MatchResult,
): MatchReason {
  const matched = match.breakdown.filter((b) => b.state === "match");
  const missing = match.breakdown.filter((b) => b.state === "missing");
  const mustHaveMissing = missing.filter((b) => b.mustHave);
  const totalSkills = match.breakdown.length;

  // -------- Positive signals --------
  const positives: string[] = [];

  if (totalSkills > 0 && matched.length > 0) {
    const sample = matched
      .slice(0, 2)
      .map((b) => b.name);
    const ratio = `${matched.length} dari ${totalSkills} skill`;
    if (sample.length === 1) {
      positives.push(`${ratio} terpenuhi (${sample[0]})`);
    } else {
      positives.push(`${ratio} terpenuhi (${sample.join(", ")})`);
    }
  }

  // Tipe pekerjaan match preferensi
  if (
    candidate.preferredJobTypes &&
    candidate.preferredJobTypes.length > 0 &&
    candidate.preferredJobTypes.includes(job.type)
  ) {
    positives.push(`tipe ${TYPE_LABEL_ID[job.type] ?? job.type} sesuai preferensi`);
  }

  // Mode kerja match
  if (
    candidate.preferredWorkModes &&
    candidate.preferredWorkModes.length > 0 &&
    job.workMode &&
    candidate.preferredWorkModes.includes(job.workMode)
  ) {
    positives.push(`mode ${MODE_LABEL_ID[job.workMode] ?? job.workMode} sesuai preferensi`);
  }

  // Lokasi match
  if (candidate.preferredCities && candidate.preferredCities.length > 0) {
    const jobCity = shortCity(job.location);
    if (
      jobCity &&
      candidate.preferredCities.some(
        (c) => c.toLowerCase() === jobCity.toLowerCase(),
      )
    ) {
      positives.push(`lokasi ${jobCity} sesuai preferensi`);
    }
  }

  // Industri match
  if (
    candidate.industries &&
    candidate.industries.length > 0 &&
    job.industry
  ) {
    const ji = job.industry.toLowerCase();
    const matchedIndustry = candidate.industries.find((c) =>
      ji.includes(c.toLowerCase()),
    );
    if (matchedIndustry) {
      positives.push(`industri ${matchedIndustry.toLowerCase()} sesuai minatmu`);
    }
  }

  // Pengalaman cocok dengan range lowongan
  if (
    typeof job.minExperienceYears === "number" &&
    candidate.experienceYears >= job.minExperienceYears &&
    job.minExperienceYears > 0
  ) {
    positives.push(
      `pengalaman ${candidate.experienceYears} tahun memenuhi syarat`,
    );
  }

  // Salary di atas ekspektasi (positive signal: lowongan bayar lebih tinggi)
  if (
    candidate.expectedSalary > 0 &&
    job.salaryMin > 0 &&
    job.salaryMin >= candidate.expectedSalary
  ) {
    positives.push("gaji di atas ekspektasimu");
  }

  // -------- Negative signals --------
  const negatives: string[] = [];

  if (mustHaveMissing.length > 0) {
    const sample = mustHaveMissing.slice(0, 2).map((b) => b.name);
    if (mustHaveMissing.length === 1) {
      negatives.push(`skill wajib ${sample[0]} belum ada`);
    } else {
      negatives.push(
        `${mustHaveMissing.length} skill wajib belum ada (${sample.join(", ")})`,
      );
    }
  } else if (missing.length > 0 && matched.length > 0) {
    // Hanya nice-to-have yang missing — tampilkan sekali kalau jumlahnya banyak
    if (missing.length >= 2) {
      const sample = missing.slice(0, 2).map((b) => b.name);
      negatives.push(`${missing.length} skill pendukung belum ada (${joinList(sample)})`);
    }
  } else if (matched.length === 0 && missing.length > 0) {
    negatives.push("belum ada skill profilmu yang cocok");
  }

  // Tipe pekerjaan tidak match preferensi
  if (
    candidate.preferredJobTypes &&
    candidate.preferredJobTypes.length > 0 &&
    !candidate.preferredJobTypes.includes(job.type)
  ) {
    negatives.push(
      `tipe ${TYPE_LABEL_ID[job.type] ?? job.type} di luar preferensimu`,
    );
  }

  // Mode kerja tidak match (kecuali user OK hybrid)
  if (
    candidate.preferredWorkModes &&
    candidate.preferredWorkModes.length > 0 &&
    job.workMode &&
    !candidate.preferredWorkModes.includes(job.workMode) &&
    !candidate.preferredWorkModes.includes("hybrid") &&
    job.workMode !== "hybrid"
  ) {
    negatives.push(
      `mode ${MODE_LABEL_ID[job.workMode] ?? job.workMode} berbeda dari preferensimu`,
    );
  }

  // Lokasi tidak match
  if (candidate.preferredCities && candidate.preferredCities.length > 0) {
    const jobCity = shortCity(job.location);
    if (
      jobCity &&
      !candidate.preferredCities.some(
        (c) => c.toLowerCase() === jobCity.toLowerCase(),
      )
    ) {
      negatives.push(`lokasi ${jobCity} di luar kota yang kamu pilih`);
    }
  }

  // Pengalaman kurang
  if (
    typeof job.minExperienceYears === "number" &&
    job.minExperienceYears > 0 &&
    candidate.experienceYears < job.minExperienceYears
  ) {
    negatives.push(
      `butuh pengalaman ${job.minExperienceYears} tahun, kamu baru ${candidate.experienceYears}`,
    );
  }

  // Salary di bawah ekspektasi
  if (
    candidate.expectedSalary > 0 &&
    job.salaryMax > 0 &&
    job.salaryMax < candidate.expectedSalary
  ) {
    negatives.push("gaji maksimum di bawah ekspektasimu");
  }

  return {
    positive: composeSentence(positives, "Cocok karena"),
    negative: composeSentence(negatives, "Yang menahan:"),
  };
}

function composeSentence(parts: string[], prefix: string): string {
  const items = uniq(parts).slice(0, 3);
  if (items.length === 0) return "";
  // Kapital di huruf pertama setelah prefix.
  const joined = joinList(items, items.length);
  return `${prefix} ${joined}.`;
}

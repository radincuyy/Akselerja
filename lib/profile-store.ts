import type { Candidate, CvFile, Education, Experience } from "./types";
import { me as seedMe } from "./mock-data";

// Module-level mutable profile state. Single-process, resets on server restart.
// Seeded once from mock-data me. In production this is Cosmos DB.

let initialised = false;
let cachedProfile: Candidate;
let visibility: "applied-only" | "all-companies" = "applied-only";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function seed() {
  if (initialised) return;
  initialised = true;
  cachedProfile = {
    ...seedMe,
    education: [
      {
        id: uid("ed"),
        institution: "Politeknik APP Jakarta",
        degree: "D3 Manajemen Logistik",
        startMonth: "2022-09",
        endMonth: "2025-07",
        notes: "Konsentrasi operasional gudang dan rantai pasok.",
      },
    ],
    experience: [
      {
        id: uid("ex"),
        position: "Magang Admin Gudang",
        company: "CV Maju Bersama",
        startMonth: "2024-01",
        endMonth: "2024-07",
        duties:
          "Membantu pencatatan stok harian, koordinasi dengan kurir, dan penyusunan laporan persediaan mingguan.",
      },
    ],
  };
}

export function getProfile(): Candidate {
  seed();
  return cachedProfile;
}

export type ProfileBasicInput = {
  name: string;
  location: string;
  bio: string;
  experienceYears: number;
  expectedSalary: number;
  email: string;
};

export function updateProfileBasic(input: ProfileBasicInput) {
  seed();
  cachedProfile = {
    ...cachedProfile,
    name: input.name,
    location: input.location,
    bio: input.bio,
    experienceYears: input.experienceYears,
    expectedSalary: input.expectedSalary,
    email: input.email,
  };
  return cachedProfile;
}

export function setEducationList(list: Education[]) {
  seed();
  cachedProfile = { ...cachedProfile, education: list };
  return cachedProfile;
}

export function setExperienceList(list: Experience[]) {
  seed();
  cachedProfile = { ...cachedProfile, experience: list };
  return cachedProfile;
}

export function setCv(cv: CvFile) {
  seed();
  cachedProfile = { ...cachedProfile, cv };
  return cachedProfile;
}

export function newEducationId() {
  return uid("ed");
}

export function newExperienceId() {
  return uid("ex");
}

export function getVisibility() {
  seed();
  return visibility;
}

export function setVisibility(v: "applied-only" | "all-companies") {
  seed();
  visibility = v;
}

// Format helpers, used in UI.
export function formatMonthYear(monthIso: string, locale = "id-ID") {
  if (!monthIso) return "";
  const d = new Date(`${monthIso}-01`);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatPeriod(startMonth: string, endMonth: string) {
  const start = formatMonthYear(startMonth);
  if (!endMonth) return `${start} – sekarang`;
  return `${start} – ${formatMonthYear(endMonth)}`;
}

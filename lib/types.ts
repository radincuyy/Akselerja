export type SkillState = "match" | "improve" | "missing";

export type Skill = {
  id: string;
  name: string;
  level: 1 | 2 | 3; // 1=Beginner 2=Intermediate 3=Advanced
};

export type SkillRequirement = {
  skillId: string;
  required: 1 | 2 | 3;
  weight?: number;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  type: "Full-time" | "Part-time" | "Kontrak" | "Magang";
  industry: string;
  description: string;
  requirements: SkillRequirement[];
  postedAt: string;
  status?: "open" | "closed";
  closedAt?: string;
};

export type Course = {
  id: string;
  title: string;
  provider: string;
  durationHours: number;
  level: 1 | 2 | 3;
  free: boolean;
  priceIdr?: number;
  skillId: string;
  description: string;
};

export type PracticeType =
  | "case-simulation"
  | "roleplay"
  | "document-review"
  | "design-brief";

export type PracticeRubricCriterion = {
  id: string;
  name: string;
  description: string;
  weight: number;
  signals: string[];
};

export type PracticeTask = {
  id: string;
  slug: string;
  role: string;
  title: string;
  skillId: string;
  level: 1 | 2 | 3;
  type: PracticeType;
  estimatedMinutes: number;
  sourceLabel: string;
  sourceNotes: string[];
  scenario: string;
  instructions: string[];
  expectedEvidence: string[];
  rubric: PracticeRubricCriterion[];
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  startMonth: string; // YYYY-MM
  endMonth: string; // YYYY-MM atau "" kalau masih berjalan
  notes?: string;
};

export type Experience = {
  id: string;
  position: string;
  company: string;
  startMonth: string;
  endMonth: string;
  duties?: string;
};

export type CvFile = {
  filename: string;
  uploadedAt: string; // ISO
  sizeBytes?: number;
  // url?: string; akan diisi saat Azure Blob hidup
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  location: string;
  experienceYears: number;
  expectedSalary: number;
  readinessScore: number;
  skills: { skillId: string; level: 1 | 2 | 3 }[];
  bio: string;
  status?: "ready" | "trainable";
  education?: Education[];
  experience?: Experience[];
  cv?: CvFile;
};

export type Assessment = {
  id: string;
  slug: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  skillId: string;
  description: string;
};

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
};

// --- Loop lamaran ---

export type ApplicationStatus =
  | "submitted" // Terkirim
  | "reviewing" // Direview
  | "invited" // Diundang interview
  | "accepted" // Diterima
  | "rejected"; // Ditolak

export type RejectReasonId =
  | "skill-gap"
  | "experience"
  | "location"
  | "salary"
  | "filled";

export type ApplicationEvent = {
  status: ApplicationStatus;
  at: string; // ISO
  by: "candidate" | "hr" | "system";
};

export type Application = {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  scoreAtApply: number;
  createdAt: string;
  history: ApplicationEvent[];
  rejectReason?: RejectReasonId;
  hrRating?: 1 | 2 | 3 | 4 | 5;
  candidateSeenAt?: string; // last time candidate opened detail
};

export type HrNote = {
  id: string;
  applicationId: string;
  text: string;
  createdAt: string;
  authorName: string;
};

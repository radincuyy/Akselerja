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
  name?: string;
};

export type WorkMode = "onsite" | "hybrid" | "remote";

export type JobType = "Full-time" | "Part-time" | "Kontrak" | "Magang";

export type Job = {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  companyLogo?: string;
  companyVerified?: boolean;
  companySize?: string;
  companyOverview?: string;
  companyWebsite?: string;
  companyInstagramUrl?: string;
  companyFacebookUrl?: string;
  companyLinkedInUrl?: string;
  industryBreadcrumb?: string[];
  officeAddress?: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  bonusMin?: number;
  bonusMax?: number;
  type: JobType;
  industry: string;
  workMode?: WorkMode;
  description: string;
  requirements: SkillRequirement[];
  postedAt: string;
  status?: "open" | "closed";
  closedAt?: string;
  applyUrl?: string;
  minEducation?: string;
  minExperienceYears?: number;
  maxExperienceYears?: number;
  benefits?: string[];
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
  startMonth: string;
  endMonth: string;
  gpa?: string;
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
  uploadedAt: string;
  sizeBytes?: number;
  blobName?: string;
  contentType?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  location: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  experienceYears: number;
  expectedSalary: number;
  readinessScore: number;
  skills: { skillId: string; level: 1 | 2 | 3; name?: string }[];
  bio: string;
  status?: "ready" | "trainable";
  preferredJobTypes?: JobType[];
  preferredWorkModes?: WorkMode[];
  preferredCities?: string[];
  industries?: string[];
  education?: Education[];
  experience?: Experience[];
  cv?: CvFile;
  profileSummary?: string;
  profileVector?: number[];
  profileVectorUpdatedAt?: string;
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
  candidateSeenAt?: string;
};

export type HrNote = {
  id: string;
  applicationId: string;
  text: string;
  createdAt: string;
  authorName: string;
};

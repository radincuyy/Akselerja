export type Skill = {
  id: string;
  name: string;
};

export type SkillRequirement = {
  skillId: string;
  mustHave: boolean;
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
  industryId?: string;
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
  descriptionVector?: number[];
};

export type Course = {
  id: string;
  title: string;
  provider: string;
  durationHours: number;
  free: boolean;
  priceIdr?: number;
  skillId: string;
  description: string;
};

type PracticeType =
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

export type OrganizationExperience = {
  id: string;
  role: string;
  organization: string;
  startMonth: string;
  endMonth: string;
  duties?: string;
};

export type ProjectExperience = {
  id: string;
  title: string;
  context?: string;
  startMonth: string;
  endMonth: string;
  duties?: string;
  link?: string;
};

export type Achievement = {
  id: string;
  title: string;
  year: string;
  description?: string;
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
  skills: { skillId: string; name?: string }[];
  bio: string;
  status?: "ready" | "trainable";
  preferredJobTypes?: JobType[];
  preferredWorkModes?: WorkMode[];
  education?: Education[];
  experience?: Experience[];
  organizations?: OrganizationExperience[];
  projects?: ProjectExperience[];
  achievements?: Achievement[];
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

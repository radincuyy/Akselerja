import type { Assessment, AssessmentQuestion } from "./types";
import { getGeneratedAssessmentQuestions } from "./assessment-generation";
import { CONTAINERS, getContainer } from "./db";
import { skillById } from "./skills";
import { unstable_cache } from "next/cache";

export const ASSESSMENTS_CACHE_TAG = "assessments";
const DYNAMIC_ASSESSMENT_PREFIX = "skill-assessment-";

const listAssessmentsCached = unstable_cache(
  async (): Promise<Assessment[]> => {
    const container = getContainer(CONTAINERS.assessments);
    const { resources } = await container.items
      .query<Assessment>({ query: "SELECT * FROM c" })
      .fetchAll();
    return resources;
  },
  ["assessments"],
  {
    tags: [ASSESSMENTS_CACHE_TAG],
    revalidate: 3600,
  },
);

const getAssessmentBySlugCached = unstable_cache(
  async (slug: string): Promise<Assessment | undefined> => {
    const container = getContainer(CONTAINERS.assessments);
    const { resources } = await container.items
      .query<Assessment>({
        query: "SELECT * FROM c WHERE c.slug = @slug",
        parameters: [{ name: "@slug", value: slug }],
      })
      .fetchAll();
    return resources[0];
  },
  ["assessment-by-slug"],
  {
    tags: [ASSESSMENTS_CACHE_TAG],
    revalidate: 3600,
  },
);

const getAssessmentQuestionsBySlugCached = unstable_cache(
  async (slug: string): Promise<AssessmentQuestion[]> => {
    const container = getContainer(CONTAINERS.assessmentQuestions);
    const { resources } = await container.items
      .query<AssessmentQuestion & { assessmentId: string }>({
        query: "SELECT * FROM c WHERE c.assessmentId = @aid",
        parameters: [{ name: "@aid", value: slug }],
      })
      .fetchAll();
    return resources.map((q) => {
      const { assessmentId: _a, ...rest } = q;
      return rest as AssessmentQuestion;
    });
  },
  ["assessment-questions-by-slug"],
  {
    tags: [ASSESSMENTS_CACHE_TAG],
    revalidate: 3600,
  },
);

function dynamicSkillIdFromSlug(slug: string): string | null {
  if (!slug.startsWith(DYNAMIC_ASSESSMENT_PREFIX)) return null;
  return slug.slice(DYNAMIC_ASSESSMENT_PREFIX.length) || null;
}

function dynamicAssessmentForSkill(skillId: string): Assessment | null {
  const skill = skillById[skillId];
  if (!skill) return null;
  return {
    id: `${DYNAMIC_ASSESSMENT_PREFIX}${skillId}`,
    slug: `${DYNAMIC_ASSESSMENT_PREFIX}${skillId}`,
    title: `Assessment ${skill.name}`,
    durationMinutes: 8,
    questionCount: 5,
    skillId,
    description:
      "Soal dibuat otomatis dari referensi SKKNI yang relevan untuk menguji keputusan kerja dan pemahaman prosedur.",
  };
}

function mergeDynamicAssessments(
  stored: Assessment[],
  skillIds: string[],
): Assessment[] {
  const existingSkillIds = new Set(stored.map((assessment) => assessment.skillId));
  const existingIds = new Set(stored.map((assessment) => assessment.id));
  const dynamic = skillIds
    .filter((skillId) => skillById[skillId])
    .filter((skillId) => !existingSkillIds.has(skillId))
    .map(dynamicAssessmentForSkill)
    .filter((assessment): assessment is Assessment => Boolean(assessment))
    .filter((assessment) => !existingIds.has(assessment.id));

  return [...dynamic, ...stored];
}

export async function listAssessmentsAsync(): Promise<Assessment[]> {
  return listAssessmentsCached();
}

export async function getAssessmentBySlugAsync(
  slug: string,
): Promise<Assessment | undefined> {
  const stored = await getAssessmentBySlugCached(slug);
  if (stored) return stored;

  const dynamicSkillId = dynamicSkillIdFromSlug(slug);
  if (!dynamicSkillId) return undefined;
  return dynamicAssessmentForSkill(dynamicSkillId) ?? undefined;
}

export async function getAssessmentQuestionsBySlugAsync(
  slug: string,
): Promise<AssessmentQuestion[]> {
  const stored = await getAssessmentQuestionsBySlugCached(slug);
  if (stored.length > 0) return stored;

  const assessment = await getAssessmentBySlugAsync(slug);
  if (!assessment) return [];
  return getGeneratedAssessmentQuestions(assessment);
}

export async function listAssessmentsForSkillIdsAsync(
  skillIds: string[],
): Promise<Assessment[]> {
  const stored = await listAssessmentsCached();
  return mergeDynamicAssessments(stored, skillIds);
}

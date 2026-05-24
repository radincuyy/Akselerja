import type { Assessment, AssessmentQuestion } from "./types";
import { CONTAINERS, getContainer } from "./db";
import { unstable_cache } from "next/cache";

export const ASSESSMENTS_CACHE_TAG = "assessments";

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

export async function listAssessmentsAsync(): Promise<Assessment[]> {
  return listAssessmentsCached();
}

export async function getAssessmentBySlugAsync(
  slug: string,
): Promise<Assessment | undefined> {
  return getAssessmentBySlugCached(slug);
}

export async function getAssessmentQuestionsBySlugAsync(
  slug: string,
): Promise<AssessmentQuestion[]> {
  return getAssessmentQuestionsBySlugCached(slug);
}

import type { Assessment, AssessmentQuestion } from "./types";
import { CONTAINERS, getContainer } from "./db";

export async function listAssessmentsAsync(): Promise<Assessment[]> {
  const container = getContainer(CONTAINERS.assessments);
  const { resources } = await container.items
    .query<Assessment>({ query: "SELECT * FROM c" })
    .fetchAll();
  return resources;
}

export async function getAssessmentBySlugAsync(
  slug: string,
): Promise<Assessment | undefined> {
  const container = getContainer(CONTAINERS.assessments);
  const { resources } = await container.items
    .query<Assessment>({
      query: "SELECT * FROM c WHERE c.slug = @slug",
      parameters: [{ name: "@slug", value: slug }],
    })
    .fetchAll();
  return resources[0];
}

export async function getAssessmentQuestionsBySlugAsync(
  slug: string,
): Promise<AssessmentQuestion[]> {
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
}

import type { PracticeTask } from "./types";
import { CONTAINERS, getContainer } from "./db";

export async function listPracticeTasksAsync(): Promise<PracticeTask[]> {
  const container = getContainer(CONTAINERS.practiceTasks);
  const { resources } = await container.items
    .query<PracticeTask>({ query: "SELECT * FROM c" })
    .fetchAll();
  return resources;
}

export async function getPracticeTaskBySlugAsync(
  slug: string,
): Promise<PracticeTask | undefined> {
  const container = getContainer(CONTAINERS.practiceTasks);
  const { resources } = await container.items
    .query<PracticeTask>({
      query: "SELECT * FROM c WHERE c.slug = @slug",
      parameters: [{ name: "@slug", value: slug }],
    })
    .fetchAll();
  return resources[0];
}

export async function getPracticeTaskByIdAsync(
  id: string,
): Promise<PracticeTask | undefined> {
  const container = getContainer(CONTAINERS.practiceTasks);
  try {
    const { resource } = await container.item(id, id).read<PracticeTask>();
    return resource ?? undefined;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 404
    ) {
      return undefined;
    }
    throw err;
  }
}

import type { Course } from "./types";
import { CONTAINERS, getContainer } from "./db";

export async function listCoursesAsync(): Promise<Course[]> {
  const container = getContainer(CONTAINERS.courses);
  const { resources } = await container.items
    .query<Course>({ query: "SELECT * FROM c" })
    .fetchAll();
  return resources;
}

export async function getCoursesForSkillsAsync(
  skillIds: string[],
): Promise<Course[]> {
  if (skillIds.length === 0) return [];
  const all = await listCoursesAsync();
  const bySkill = new Map<string, Course>();
  for (const c of all) {
    if (!bySkill.has(c.skillId)) bySkill.set(c.skillId, c);
  }
  return skillIds
    .map((s) => bySkill.get(s))
    .filter((c): c is Course => Boolean(c));
}

import type { Course } from "./types";
import { CONTAINERS, getContainer } from "./db";
import { embedText } from "./gemini-embed";
import { skillById } from "./skills";
import { unstable_cache } from "next/cache";

type CourseRecord = Course & {
  courseVector?: number[];
};

const COURSE_CACHE_TAG = "courses";

const listCourseRecordsCached = unstable_cache(
  async (): Promise<CourseRecord[]> => {
    const container = getContainer(CONTAINERS.courses);
    const { resources } = await container.items
      .query<CourseRecord>({ query: "SELECT * FROM c" })
      .fetchAll();
    return resources;
  },
  ["course-records"],
  {
    tags: [COURSE_CACHE_TAG],
    revalidate: 3600,
  },
);

const findCoursesForGapsCached = unstable_cache(
  async (idsCsv: string, limit: number): Promise<Course[]> => {
    const ids = idsCsv.split(",").filter(Boolean);
    return findCoursesForGapsUncached(ids, limit);
  },
  ["courses-for-gaps"],
  {
    tags: [COURSE_CACHE_TAG],
    revalidate: 86400,
  },
);

function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

function buildGapQueryText(skillIds: string[]): string {
  const names = skillIds
    .map((id) => skillById[id]?.name ?? id)
    .filter(Boolean);
  if (names.length === 0) return "";
  return `Kebutuhan belajar untuk skill: ${names.join(", ")}.`;
}


async function findCoursesForGapsUncached(
  gapSkillIds: string[],
  limit = 4,
): Promise<Course[]> {
  if (gapSkillIds.length === 0) return [];
  const records = await listCourseRecordsCached();
  if (records.length === 0) return [];

  const exactMatches: CourseRecord[] = [];
  const seenCourseIds = new Set<string>();
  for (const skillId of gapSkillIds) {
    const course = records.find((c) => c.skillId === skillId);
    if (!course || seenCourseIds.has(course.id)) continue;
    seenCourseIds.add(course.id);
    exactMatches.push(course);
    if (exactMatches.length >= limit) {
      return exactMatches.map(stripVector);
    }
  }
  if (exactMatches.length > 0) {
    return exactMatches.map(stripVector);
  }

  try {
    const queryText = buildGapQueryText(gapSkillIds);
    if (queryText) {
      const queryVec = await embedText(queryText, "RETRIEVAL_QUERY");
      const scored = records
        .map((c) => ({
          course: c,
          score: Array.isArray(c.courseVector)
            ? cosineSim(queryVec, c.courseVector)
            : -Infinity,
        }))
        .filter((s) => Number.isFinite(s.score))
        .sort((a, b) => b.score - a.score);
      if (scored.length > 0) {
        return scored.slice(0, limit).map((s) => stripVector(s.course));
      }
    }
  } catch (err) {
    console.warn("[courses] vector match failed, falling back:", err);
  }

  const bySkill = new Map<string, CourseRecord>();
  for (const c of records) {
    if (!bySkill.has(c.skillId)) bySkill.set(c.skillId, c);
  }
  return gapSkillIds
    .map((s) => bySkill.get(s))
    .filter((c): c is CourseRecord => Boolean(c))
    .slice(0, limit)
    .map(stripVector);
}

export async function findCoursesForGapsAsync(
  gapSkillIds: string[],
  limit = 4,
): Promise<Course[]> {
  if (gapSkillIds.length === 0) return [];
  return findCoursesForGapsCached(gapSkillIds.join(","), limit);
}

function stripVector(record: CourseRecord): Course {
  const { courseVector: _v, ...rest } = record as CourseRecord & {
    courseVector?: number[];
  };
  return rest;
}

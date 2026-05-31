import { describe, expect, it } from "vitest";
import { skillById } from "@/lib/learning/skills";

describe("skillById", () => {
  it("indexes skills by id", () => {
    expect(skillById["excel"]?.name).toBe("Microsoft Excel");
    expect(skillById["sql"]?.name).toBe("SQL");
  });

  it("returns undefined for unknown skill id", () => {
    expect(skillById["nonexistent-skill-xyz"]).toBeUndefined();
  });
});

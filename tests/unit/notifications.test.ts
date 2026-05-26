import { describe, expect, it } from "vitest";
import { buildNotifications } from "@/lib/notifications";

describe("buildNotifications", () => {
  it("returns base notifications when no input given", () => {
    const list = buildNotifications({});
    expect(list.length).toBeGreaterThan(0);
    expect(list.find((n) => n.id === "profile")).toBeTruthy();
    expect(list.find((n) => n.id === "jobs")).toBeTruthy();
  });

  it("prepends practice attempt notification when given", () => {
    const list = buildNotifications({
      latestPractice: {
        id: "p1",
        taskTitle: "Latihan Excel",
        skillId: "excel",
        score: 85,
        passed: true,
        completedAt: new Date().toISOString(),
      },
    });
    expect(list[0].id).toBe("practice-attempt-p1");
    expect(list[0].title).toMatch(/selesai/i);
    expect(list[0].body).toContain("Latihan Excel");
    expect(list[0].body).toContain("85%");
  });

  it("differentiates passed vs failed practice copy", () => {
    const passed = buildNotifications({
      latestPractice: {
        id: "p1",
        taskTitle: "T",
        skillId: "excel",
        score: 90,
        passed: true,
        completedAt: new Date().toISOString(),
      },
    });
    const failed = buildNotifications({
      latestPractice: {
        id: "p2",
        taskTitle: "T",
        skillId: "excel",
        score: 40,
        passed: false,
        completedAt: new Date().toISOString(),
      },
    });
    expect(passed[0].body).not.toBe(failed[0].body);
  });

  it("changes profile notification copy based on hasCv", () => {
    const withCv = buildNotifications({ hasCv: true });
    const withoutCv = buildNotifications({ hasCv: false });
    const profileWith = withCv.find((n) => n.id === "profile");
    const profileWithout = withoutCv.find((n) => n.id === "profile");
    expect(profileWith?.title).not.toBe(profileWithout?.title);
  });

  it("ranks notifications: practice first, then assessment, then static", () => {
    const list = buildNotifications({
      latestPractice: {
        id: "p1",
        taskTitle: "T",
        skillId: "excel",
        score: 80,
        passed: true,
        completedAt: new Date().toISOString(),
      },
      latestAssessment: {
        id: "a1",
        skillId: "excel",
        score: 80,
        passed: true,
        correct: 8,
        total: 10,
        takenAt: new Date().toISOString(),
      },
    });
    expect(list[0].id).toBe("practice-attempt-p1");
    expect(list[1].id).toBe("assessment-attempt-a1");
  });

  it("marks dynamic notifications as unread", () => {
    const list = buildNotifications({
      latestAssessment: {
        id: "a1",
        skillId: "excel",
        score: 80,
        passed: true,
        correct: 8,
        total: 10,
        takenAt: new Date().toISOString(),
      },
    });
    expect(list[0].unread).toBe(true);
  });
});

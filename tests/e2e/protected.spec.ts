import { test, expect, request } from "@playwright/test";

test.describe("protected routes", () => {
  test("/app redirects unauthenticated user to /masuk", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/masuk/);
  });

  test("/api/notifications returns 401 without session", async () => {
    const ctx = await request.newContext();
    const res = await ctx.get("/api/notifications");
    expect(res.status()).toBe(401);
  });

  test("test sign-in cookie reaches /app and redirects to onboarding", async ({
    page,
    context,
  }) => {
    const userId = `e2e-${Date.now()}`;
    const signInRes = await context.request.post("/api/test/sign-in", {
      data: {
        userId,
        email: `${userId}@example.test`,
        name: "E2E User",
      },
    });
    expect(signInRes.ok()).toBeTruthy();

    await page.goto("/app");
    await expect(page).toHaveURL(/\/onboarding/);
  });
});

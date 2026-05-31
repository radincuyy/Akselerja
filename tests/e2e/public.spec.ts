import { test, expect } from "@playwright/test";

test.describe("public routes", () => {
  test("landing page renders hero + signup form", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("kamu@email.com").first()).toBeVisible();
  });

  test("legal pages render", async ({ page }) => {
    for (const path of ["/syarat", "/privasi", "/kebijakan-data"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("/daftar redirects to /daftar/kandidat", async ({ page }) => {
    await page.goto("/daftar");
    await expect(page).toHaveURL(/\/daftar\/kandidat$/);
  });

  test("signup form rejects weak password", async ({ page }) => {
    await page.goto("/daftar/kandidat");
    await page.getByLabel("Nama lengkap").fill("E2E User");
    await page.getByLabel("Email").fill("e2e-weak@example.com");
    const passwordInput = page.getByLabel("Password", { exact: true });
    await passwordInput.fill("short");
    await page
      .getByRole("button", { name: /Daftar dan lanjut/i })
      .click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("sign-in page renders credentials form", async ({ page }) => {
    await page.goto("/masuk");
    await expect(
      page.getByLabel("Email", { exact: true }).first(),
    ).toBeVisible();
  });
});

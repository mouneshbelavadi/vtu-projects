import { test, expect } from "@playwright/test";

test.describe("Authentication and Route Protection", () => {
  test("renders /login with email code input and Google sign-in", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/Sign In/);
    await expect(
      page.getByRole("heading", { name: "Sign in to your account" })
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send 6-digit code" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" })
    ).toBeVisible();
  });

  test("unauthenticated visit to /account redirects to /login with safe next parameter", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount/);
  });

  test("unauthenticated visit to /admin redirects to /login with safe next parameter", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });

  test("unauthenticated visit to /checkout redirects to /login with safe next parameter", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);
  });

  test("verifies zero auth tokens stored in localStorage or sessionStorage", async ({ page }) => {
    await page.goto("/login");

    const storageReport = await page.evaluate(() => {
      const localKeys = Object.keys(window.localStorage);
      const sessionKeys = Object.keys(window.sessionStorage);

      const forbiddenLocal = localKeys.filter((k) =>
        /token|supabase|auth|session/i.test(k)
      );
      const forbiddenSession = sessionKeys.filter((k) =>
        /token|supabase|auth|session/i.test(k)
      );

      return {
        forbiddenLocal,
        forbiddenSession,
        totalLocal: localKeys.length,
        totalSession: sessionKeys.length,
      };
    });

    expect(storageReport.forbiddenLocal).toHaveLength(0);
    expect(storageReport.forbiddenSession).toHaveLength(0);
    expect(storageReport.totalLocal).toBe(0);
    expect(storageReport.totalSession).toBe(0);
  });
});

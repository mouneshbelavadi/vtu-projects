import { test, expect } from "@playwright/test";

test.describe("Smoke Test", () => {
  test("loads the home page without errors", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Verify main heading
    const heading = page.locator("h1");
    await expect(heading).toContainText("VTU Adda Projects");

    // Verify absence of X-Powered-By
    const headers = response?.headers();
    expect(headers?.["x-powered-by"]).toBeUndefined();
  });
});

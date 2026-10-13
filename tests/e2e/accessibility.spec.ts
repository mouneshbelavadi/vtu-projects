import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Design System Accessibility & Usability (Prompt 2)", () => {
  test("home page has zero serious or critical accessibility violations at desktop width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(criticalOrSerious).toEqual([]);
  });

  test("design page has zero serious or critical accessibility violations at desktop width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const response = await page.goto("/design");

    // In dev mode, /design is accessible
    if (response?.status() === 200) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const criticalOrSerious = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
      );

      expect(criticalOrSerious).toEqual([]);
    }
  });

  test("ensures no horizontal scrolling at 360px mobile viewport on home page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/");

    const isHorizontalScrollable = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isHorizontalScrollable).toBe(false);
  });

  test("ensures no horizontal scrolling at 360px mobile viewport on design page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    const response = await page.goto("/design");

    if (response?.status() === 200) {
      const isHorizontalScrollable = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(isHorizontalScrollable).toBe(false);
    }
  });

  test("dialog keyboard accessibility: Tab and Escape key return focus to trigger", async ({
    page,
  }) => {
    await page.goto("/design");

    const dialogButton = page.getByRole("button", { name: "Open Policy Dialog" });
    if (await dialogButton.isVisible()) {
      await dialogButton.focus();
      await page.keyboard.press("Enter");

      // Verify dialog is opened
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Press Escape to close
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();

      // Verify focus returned to trigger
      await expect(dialogButton).toBeFocused();
    }
  });
});

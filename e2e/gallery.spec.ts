import { test, expect } from "@playwright/test";

test("gallery page renders filter buttons and photo cards", async ({ page }) => {
  await page.goto("/gallery");

  await expect(page.locator("h1")).toContainText("Moments");
  await expect(page.getByText("Cloud")).toBeVisible();
  await expect(page.getByText("Cybersecurity")).toBeVisible();
  await expect(page.getByText("Web")).toBeVisible();
  await expect(page.getByText("Women in Tech")).toBeVisible();

  await expect(page.getByText("Cloud workshop photo")).toBeVisible({ timeout: 15000 });
});

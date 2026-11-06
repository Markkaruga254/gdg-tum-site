import { test, expect } from "@playwright/test";

test("gallery page renders track filter buttons and photo cards", async ({ page }) => {
  await page.goto("/gallery");

  await expect(page.getByRole("heading", { name: "Moments" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cloud", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cybersecurity", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Web", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Women in Tech", exact: true })).toBeVisible();

  await expect(page.getByText("Cloud workshop photo")).toBeVisible({ timeout: 15000 });
});

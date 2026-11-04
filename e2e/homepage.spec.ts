import { test, expect } from "@playwright/test";

test("homepage renders public shell and sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toContainText("BUILD");
  await expect(page.getByText("Explore tracks →")).toBeVisible();

  await expect(page.getByText("Next event")).toBeVisible();
  await expect(page.getByText("Latest writeups")).toBeVisible();
  await expect(page.getByText("Four tracks, one community")).toBeVisible();
  await expect(page.getByText("Moments")).toBeVisible();

  await expect(page.locator("nav")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

test("homepage navigate to tracks page", async ({ page }) => {
  await page.goto("/");
  await page.click('text=Explore tracks →');
  await expect(page).toHaveURL("/tracks");
  await expect(page.locator("h1")).toContainText("Tracks");
});

test("homepage navigate to gallery page", async ({ page }) => {
  await page.goto("/");
  await page.click('text=Open the gallery ↗');
  await expect(page).toHaveURL("/gallery");
});

import { test, expect } from "@playwright/test";

test("homepage renders the public shell and all approved sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toContainText("Build.");
  await expect(page.getByRole("link", { name: /Explore tracks/ })).toBeVisible();
  await expect(page.getByText("Next event")).toBeVisible();
  await expect(page.getByText("Latest writeups")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Four.*tracks.*One.*club/i })).toBeVisible();
  await expect(page.getByText("Moments", { exact: true })).toBeVisible();
  await expect(page.getByText("Tech blog", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Labs" })).toBeVisible();

  await expect(page.locator("nav")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

test("homepage navigates to tracks", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Explore tracks/ }).click();
  await expect(page).toHaveURL("/tracks");
  await expect(page.locator("h1")).toHaveText("Four tracks. One club.");
});

test("homepage navigates to gallery", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Open the gallery/ }).click();
  await expect(page).toHaveURL("/gallery");
});

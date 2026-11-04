import { test, expect } from "@playwright/test";

test("events page lists events and filters by track", async ({ page }) => {
  await page.goto("/events");

  await expect(page.locator("h1")).toContainText("Events");

  await expect(page.getByText("Cloud Build Day")).toBeVisible();
  await expect(page.getByText("Cloud 101 Workshop")).toBeVisible();
  await expect(page.getByText("Web Workshop")).toBeVisible();

  await page.getByLabel("Filter by track").selectOption("web");
  await expect(page.getByText("Web Workshop")).toBeVisible();
  await expect(page.getByText("Cloud Build Day")).not.toBeVisible();
});

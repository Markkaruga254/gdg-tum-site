import { test, expect } from "@playwright/test";

test("track page renders track info, leads, events, writeups", async ({ page }) => {
  await page.goto("/track?slug=cloud");

  // Wait for client-side data to load (Loading… should disappear)
  await expect(page.getByText("Loading…")).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Not found.")).not.toBeVisible();

  await expect(page.getByRole("heading", { name: "Cloud" })).toBeVisible();
  await expect(page.getByText("Cloud computing and serverless track")).toBeVisible();
  // Lead names are not visible to public visitors (T05 restricts users/{uid} reads);
  // the leads fetch gracefully degrades to an empty list.
  await expect(page.getByText("Cloud Build Day")).toBeVisible();
  await expect(page.getByText("Cloud 101 Recap")).toBeVisible();
});

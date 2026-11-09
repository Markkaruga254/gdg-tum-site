import { test, expect } from "@playwright/test";

test("track page renders track info, public lead, events and writeups", async ({ page }) => {
  await page.goto("/track?slug=cloud");

  await expect(page.getByText("Loading track…")).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Cloud", exact: true })).toBeVisible();
  await expect(page.getByText("Cloud computing and serverless track")).toBeVisible();
  await expect(page.getByText("Mark Karuga")).toBeVisible();
  await expect(page.getByText("Cloud Build Day")).toBeVisible();
  await expect(page.getByText("Cloud 101 Recap")).toBeVisible();
});

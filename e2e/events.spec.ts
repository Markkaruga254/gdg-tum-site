import { test, expect } from "@playwright/test";

test("events page lists events and filters by track", async ({ page }) => {
  await page.goto("/events");

  await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
  await expect(page.getByText("Cloud Build Day")).toBeVisible();
  await expect(page.getByText("Cloud 101 Workshop")).toBeVisible();
  await expect(page.getByText("Web Workshop")).toBeVisible();

  await page.getByRole("button", { name: "Web", exact: true }).click();
  await expect(page.getByText("Web Workshop")).toBeVisible();
  await expect(page.getByText("Cloud Build Day")).not.toBeVisible();
  await expect(page.getByText("Cloud 101 Workshop")).not.toBeVisible();
});

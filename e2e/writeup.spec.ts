import { test, expect } from "@playwright/test";

test("writeup detail page renders title, body, tag, and media", async ({ page }) => {
  await page.goto("/writeup?id=w-published-cloud");

  await expect(page.getByRole("heading", { name: "Cloud 101 Recap" })).toBeVisible();
  await expect(page.getByText("A recap of our cloud workshop")).toBeVisible();
  await expect(page.getByText("Cloud workshop photo")).toBeVisible();
});

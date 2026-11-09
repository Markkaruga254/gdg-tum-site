import { test, expect } from "@playwright/test";

test("public filters respond to clicks across the site", async ({ page }) => {
  await page.goto("/events");
  const chapterEvents = page.getByRole("button", { name: "Chapter Events", exact: true });
  await chapterEvents.click();
  await expect(chapterEvents).toHaveAttribute("aria-pressed", "true");

  await page.goto("/gallery");
  await expect(page.getByRole("link", { name: /Cloud workshop photo/ })).toBeVisible({ timeout: 15000 });
  const galleryCloud = page.getByRole("button", { name: "Cloud", exact: true });
  await galleryCloud.click();
  await expect(galleryCloud).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: /Cloud workshop photo/ })).toBeVisible();

  await page.goto("/writeups");
  await expect(page.getByText("Cloud 101 Recap", { exact: true })).toBeVisible({ timeout: 15000 });
  const writeupsWeb = page.getByRole("button", { name: "Web", exact: true });
  await writeupsWeb.click();
  await expect(writeupsWeb).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Web Intro", { exact: true })).toBeVisible();
  await expect(page.getByText("Cloud 101 Recap", { exact: true })).toBeHidden();

  await page.goto("/leads");
  await expect(page.getByText("Mark Karuga", { exact: true })).toBeVisible({ timeout: 15000 });
  const leadsAiMl = page.getByRole("button", { name: "AI/ML", exact: true });
  await leadsAiMl.click();
  await expect(leadsAiMl).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Lewis Kagiri", { exact: true })).toBeVisible();
  await expect(page.getByText("Mark Karuga", { exact: true })).toBeHidden();

  await page.goto("/blog");
  const blogCloud = page.getByRole("button", { name: "Cloud", exact: true });
  await blogCloud.click();
  await expect(blogCloud).toHaveAttribute("aria-pressed", "true");
});

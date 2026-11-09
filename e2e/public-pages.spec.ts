import { test, expect } from "@playwright/test";

test("public leads directory and lead profile render real records", async ({ page }) => {
  await page.goto("/leads");
  await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
  await expect(page.getByText("Cloud Lead")).toBeVisible();
  await expect(page.getByText("Mitchelle Ndunge")).toBeVisible();
  await expect(page.getByText("Chapter Lead")).toBeVisible();

  await page.goto("/lead?id=u-lead-cloud");
  await expect(page.getByRole("heading", { name: "Cloud Lead" })).toBeVisible();
  await expect(page.getByText("Students reached")).toBeVisible();

  await page.goto("/lead?id=u-lead-mitchelle");
  await expect(page.getByRole("heading", { name: "Mitchelle Ndunge" })).toBeVisible();
  await expect(page.getByText("Chapter Lead · 2026/27")).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/Dahliastar");
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/michelle-ndunge-7815482a2/");
});

test("tracks and event detail routes render seeded records", async ({ page }) => {
  await page.goto("/tracks");
  await expect(page.getByRole("heading", { name: "Seven tracks. One club." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cloud" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI/ML" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mobile Development" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hackathons & Solutions" })).toBeVisible();

  await page.goto("/track?slug=cloud");
  await expect(page.getByRole("heading", { name: "Cloud" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cloud Lead ↗" })).toBeVisible();

  await page.goto("/track?slug=hackathons-solutions");
  await expect(page.getByRole("heading", { name: "Hackathons & Solutions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How to take part in a hackathon" })).toBeVisible();
  await expect(page.getByText("Watch for announcements")).toBeVisible();
  await expect(page.getByRole("link", { name: /Edith Karanja/ })).toBeVisible();

  await page.goto("/event?id=ev-cloud-past");
  await expect(page.getByRole("heading", { name: "Cloud 101 Workshop" })).toBeVisible();
  await expect(page.getByText("Attended")).toBeVisible();
  await expect(page.getByRole("link", { name: /Read the writeup/ })).toBeVisible();
});

test("writeups, blog and labs pages render populated and coming-soon states", async ({ page }) => {
  await page.goto("/writeups");
  await expect(page.getByRole("heading", { name: "Writeups" })).toBeVisible();
  await expect(page.getByText("Cloud 101 Recap")).toBeVisible();

  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Tech blog" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Building with cloud-native tools" })).toBeVisible();
  await expect(page.getByText("No articles have been published yet.")).toBeHidden();

  await page.goto("/labs");
  await expect(page.getByRole("heading", { name: "Labs", exact: true })).toBeVisible();
  await expect(page.getByText("Coming soon")).toBeVisible();
});

test("login renders and protected staff pages reject signed-out visitors", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Not allowed" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Not allowed" })).toBeVisible();
});

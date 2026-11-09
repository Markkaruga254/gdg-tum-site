import { test, expect } from "@playwright/test";

test("public leads directory and lead profile render real records", async ({ page }) => {
  await page.goto("/leads");
  await expect(page.getByRole("heading", { name: "Leads", exact: true })).toBeVisible();
  await expect(page.getByText("Mark Karuga")).toBeVisible();
  await expect(page.getByText("Mitchelle Ndunge")).toBeVisible();
  await expect(page.getByText("Chapter Lead")).toBeVisible();
  for (const name of [
    "Rooney Odhiambo",
    "Mark Karuga",
    "Lewis Kagiri",
    "Ian Chacha",
    "Kimberly Gift",
    "Larah Flynn",
    "Edith Karanja",
    "Sam Ryan",
  ]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  await page.goto("/lead?id=KoYwxs8piKh4c4tkcIHzOURzCwC3");
  await expect(page.getByRole("heading", { name: "Mark Karuga", exact: true })).toBeVisible();
  await expect(page.getByText("Students reached")).toBeVisible();

  await page.goto("/lead?id=u-lead-mitchelle");
  await expect(page.getByRole("heading", { name: "Mitchelle Ndunge", exact: true })).toBeVisible();
  await expect(page.getByText("Chapter Lead · 2026/27")).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/Dahliastar");
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/michelle-ndunge-7815482a2/");

  await page.goto("/lead?id=KoYwxs8piKh4c4tkcIHzOURzCwC3");
  await expect(page.getByRole("heading", { name: "Mark Karuga", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/Markkaruga254");
  await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/mark-karuga");
});

test("tracks and event detail routes render seeded records", async ({ page }) => {
  await page.goto("/tracks");
  await expect(page.getByRole("heading", { name: "Seven tracks. One club.", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cloud", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI/ML", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mobile Development", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hackathons & Solutions", exact: true })).toBeVisible();

  await page.goto("/track?slug=cloud");
  await expect(page.getByRole("heading", { name: "Cloud", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mark Karuga ↗", exact: true })).toBeVisible();

  await page.goto("/track?slug=ai-ml");
  await expect(page.getByRole("heading", { name: "AI/ML", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lewis Kagiri/ })).toBeVisible();

  await page.goto("/track?slug=mobile");
  await expect(page.getByRole("heading", { name: "Mobile Development", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ian Chacha/ })).toBeVisible();

  await page.goto("/track?slug=hackathons-solutions");
  await expect(page.getByRole("heading", { name: "Hackathons & Solutions", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How to take part in a hackathon", exact: true })).toBeVisible();
  await expect(page.getByText("Watch for announcements")).toBeVisible();
  await expect(page.getByRole("link", { name: /Edith Karanja/ })).toBeVisible();

  await page.goto("/event?id=ev-cloud-past");
  await expect(page.getByRole("heading", { name: "Cloud 101 Workshop", exact: true })).toBeVisible();
  await expect(page.getByText("Attended")).toBeVisible();
  await expect(page.getByRole("link", { name: /Read the writeup/ })).toBeVisible();
});

test("writeups, blog and labs pages render populated and coming-soon states", async ({ page }) => {
  await page.goto("/writeups");
  await expect(page.getByRole("heading", { name: "Writeups", exact: true })).toBeVisible();
  await expect(page.getByText("Cloud 101 Recap")).toBeVisible();

  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Tech blog", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Building with cloud-native tools", exact: true })).toBeVisible();
  await expect(page.getByText("No articles have been published yet.")).toBeHidden();

  await page.goto("/labs");
  await expect(page.getByRole("heading", { name: "Labs", exact: true })).toBeVisible();
  await expect(page.getByText("Coming soon")).toBeVisible();
});

test("login renders and protected staff pages reject signed-out visitors", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Not allowed", exact: true })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Not allowed", exact: true })).toBeVisible();
});

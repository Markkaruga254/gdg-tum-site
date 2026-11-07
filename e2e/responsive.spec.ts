import { test, expect } from "@playwright/test";

const routes = [
  { name: "home", path: "/" },
  { name: "leads", path: "/leads" },
  { name: "lead-profile", path: "/lead?id=u-lead-cloud" },
  { name: "events", path: "/events" },
  { name: "event-detail", path: "/event?id=ev-cloud-past" },
  { name: "tracks", path: "/tracks" },
  { name: "track-detail", path: "/track?slug=cloud" },
  { name: "writeups", path: "/writeups" },
  { name: "writeup-detail", path: "/writeup?id=w-published-cloud" },
  { name: "gallery", path: "/gallery" },
  { name: "blog", path: "/blog" },
  { name: "labs", path: "/labs" },
  { name: "login", path: "/login" },
  { name: "admin", path: "/admin" },
  { name: "dashboard", path: "/dashboard" },
];

for (const route of routes) {
  test(`${route.name} has no horizontal overflow at mobile, tablet and desktop widths`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const width of [360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(400);

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(dimensions.document, `${route.name} overflows at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);

      if (width === 390 || width === 768 || width === 1280) {
        await page.screenshot({
          path: `test-results/mockup-review/${route.name}-${width}.png`,
          fullPage: true,
        });
      }

      if (route.name === "home" && width === 390) {
        await expect(page.getByText("Google Developer Group on Campus")).toBeHidden();
        await page.screenshot({ path: "test-results/mockup-review/home-canonical-nav-390.png", fullPage: true });
      }

      const navigation = page.getByRole("navigation", { name: "Main navigation" });
      await expect(navigation).toBeVisible();

      if (width <= 390) {
        await expect(navigation.getByRole("button", { name: "Menu" })).toBeVisible();
        await expect(navigation.getByRole("link", { name: "Events" })).toBeHidden();
        await expect(navigation.getByRole("link", { name: "Join ↗" })).toBeVisible();
        await navigation.getByRole("button", { name: "Menu" }).click();
        for (const label of ["Events", "Tracks", "Gallery", "Blog", "Leads", "Labs", "Sign in"]) {
          await expect(navigation.getByRole("link", { name: label })).toBeVisible();
        }
      } else {
        for (const label of ["Events", "Tracks", "Gallery", "Blog", "Leads", "Labs", "Sign in", "Join a track ↗"]) {
          await expect(navigation.getByRole("link", { name: label })).toBeVisible();
        }
        await expect(navigation.getByRole("button", { name: "Menu" })).toBeHidden();
      }

      if (route.name !== "home") {
        await expect(page.getByText("Google Developer Group on Campus")).toHaveCount(0);
      }
    }

    expect(pageErrors, `${route.name} raised browser errors`).toEqual([]);
  });
}

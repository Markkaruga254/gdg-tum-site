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

    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(150);

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(dimensions.document, `${route.name} overflows at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);

      if (width === 390 || width === 1280) {
        await page.screenshot({
          path: `test-results/mockup-review/${route.name}-${width}.png`,
          fullPage: true,
        });
      }
    }

    expect(pageErrors, `${route.name} raised browser errors`).toEqual([]);
  });
}

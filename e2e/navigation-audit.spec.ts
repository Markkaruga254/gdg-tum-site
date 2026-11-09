import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/events",
  "/tracks",
  "/gallery",
  "/blog",
  "/leads",
  "/writeups",
  "/labs",
  "/login",
  "/admin",
  "/dashboard",
  "/track?slug=cloud",
  "/event?id=ev-cloud-past",
  "/writeup?id=w-published-cloud",
  "/lead?id=KoYwxs8piKh4c4tkcIHzOURzCwC3",
];

test("every exported page route responds without an HTTP 404", async ({ page }) => {
  for (const route of ROUTES) {
    const response = await page.goto(route);
    expect(response, `No document response for ${route}`).not.toBeNull();
    expect(response!.status(), `Unexpected HTTP status for ${route}`).toBeLessThan(400);
  }
});

test("every same-origin link on the public pages resolves without an HTTP 404", async ({ page, request }) => {
  const destinations = new Set<string>();

  for (const route of ROUTES) {
    await page.goto(route);
    await page.locator("main h1").first().waitFor({ state: "visible", timeout: 15000 });
    const hrefs = await page.locator("a[href]").evaluateAll((links) =>
      links
        .map((link) => (link as HTMLAnchorElement).href)
        .filter((href) => {
          const url = new URL(href);
          return url.origin === window.location.origin &&
            !url.pathname.startsWith("/_next/") &&
            !url.pathname.startsWith("/api/");
        }),
    );

    for (const href of hrefs) destinations.add(href);
  }

  expect(destinations.size, "The route audit should discover internal links").toBeGreaterThan(0);

  for (const destination of destinations) {
    const response = await request.get(destination);
    expect(
      response.status(),
      `Internal link returned HTTP ${response.status()}: ${destination}`,
    ).toBeLessThan(400);
  }
});

test("desktop navigation links can be clicked to reach their destinations", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  const navigationLinks = [
    { label: "Events", href: "/events" },
    { label: "Tracks", href: "/tracks" },
    { label: "Gallery", href: "/gallery" },
    { label: "Blog", href: "/blog" },
    { label: "Leads", href: "/leads" },
    { label: "Labs", href: "/labs" },
    { label: "Sign in", href: "/login" },
  ];

  for (const link of navigationLinks) {
    await page.goto("/");
    await page.locator('nav[aria-label="Main navigation"]').getByRole("link", { name: link.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${link.href.replace("/", "\\/")}(?:[?#].*)?$`));
  }
});

test("mobile menu opens, exposes navigation, and closes after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Menu" });
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");

  const mobileNavigation = page.locator("#mobile-navigation");
  await expect(mobileNavigation.getByRole("link", { name: "Events", exact: true })).toBeVisible();
  await mobileNavigation.getByRole("link", { name: "Events", exact: true }).click();

  await expect(page).toHaveURL(/\/events$/);
});

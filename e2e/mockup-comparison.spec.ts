import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test, expect } from "@playwright/test";

type MockupScreen = {
  name: string;
  mockup: string;
  path: string;
  phoneMockup?: string;
  auth?: "admin" | "lead";
  action?: "draft-step1" | "draft-step2";
  widths?: number[];
};

const screens: MockupScreen[] = [
  { name: "home", mockup: "docs/mockups/19-finished-home-populated.html", phoneMockup: "docs/mockups/20-finished-home-phone.html", path: "/" },
  { name: "lead-profile", mockup: "docs/mockups/02-lead-profile.html", path: "/lead?id=u-lead-cloud" },
  { name: "gallery", mockup: "docs/mockups/05-gallery.html", path: "/gallery" },
  { name: "leads", mockup: "docs/mockups/08-leads.html", path: "/leads" },
  { name: "events", mockup: "docs/mockups/09-events.html", path: "/events" },
  { name: "event-detail", mockup: "docs/mockups/10-event-detail.html", path: "/event?id=ev-cloud-upcoming" },
  { name: "tracks", mockup: "docs/mockups/11-tracks.html", path: "/tracks" },
  { name: "track-detail", mockup: "docs/mockups/12-track-detail.html", path: "/track?slug=cloud" },
  { name: "writeups", mockup: "docs/mockups/13-writeups.html", path: "/writeups" },
  { name: "writeup-detail", mockup: "docs/mockups/14-writeup-detail.html", path: "/writeup?id=w-published-cloud" },
  { name: "blog", mockup: "docs/mockups/15-blog.html", path: "/blog" },
  { name: "labs", mockup: "docs/mockups/16-labs.html", path: "/labs" },
  { name: "login", mockup: "docs/mockups/17-login.html", path: "/login" },
  { name: "dashboard-new-writeup", mockup: "docs/mockups/03-dashboard-new-writeup.html", path: "/dashboard", auth: "lead", action: "draft-step2" },
  { name: "dashboard-ai-before", mockup: "docs/mockups/06-ai-assistant-before.html", path: "/dashboard", auth: "lead", action: "draft-step1" },
  { name: "admin", mockup: "docs/mockups/18-admin.html", path: "/admin", auth: "admin" },
];

test("capture approved mockups beside the current public implementation", async ({ browser }) => {
  test.setTimeout(180_000);
  const outputDir = resolve(process.cwd(), "test-results/mockup-review/comparisons");
  await mkdir(outputDir, { recursive: true });

  for (const screen of screens) {
    for (const width of screen.widths ?? [390, 1280]) {
      const height = width === 390 ? 844 : 1000;
      const context = await browser.newContext({ baseURL: "http://localhost:3000", viewport: { width, height } });
      const referencePage = await context.newPage();
      const implementationPage = await context.newPage();

      const mockupPath = width === 390 && screen.phoneMockup ? screen.phoneMockup : screen.mockup;
      const mockupUrl = pathToFileURL(resolve(process.cwd(), mockupPath)).href;
      await referencePage.goto(mockupUrl);
      await referencePage.evaluate(async () => { await document.fonts.ready; });
      const reference = await referencePage.screenshot({ fullPage: true });

      if (screen.auth) {
        await implementationPage.goto("/login?e2e=1", { waitUntil: "domcontentloaded" });
        const accountButton = screen.auth === "admin" ? "Sign in as test admin" : "Sign in as test lead";
        const accountName = screen.auth === "admin" ? "E2E Admin" : "Cloud Lead";
        await implementationPage.getByRole("button", { name: accountButton }).click();
        await expect(implementationPage.getByText(accountName)).toBeVisible();
      }

      await implementationPage.goto(screen.path, { waitUntil: "domcontentloaded" });
      await expect(implementationPage.locator("main")).toBeVisible();
      if (screen.action) {
        await implementationPage.getByRole("button", { name: /2 AI draft/ }).click();
        await implementationPage.getByRole("button", { name: "Overview" }).click();
        await implementationPage.getByText(/My writeups/).click();
        const draftId = screen.action === "draft-step2" ? "edit-writeup-w-draft-preview-cloud" : "edit-writeup-w-draft-cloud";
        await implementationPage.getByTestId(draftId).click();
        if (screen.action === "draft-step2") {
          await implementationPage.getByRole("button", { name: /2 AI draft/ }).click();
          await expect(implementationPage.getByRole("heading", { name: "New writeup" })).toBeVisible();
          await expect(implementationPage.getByRole("button", { name: "Overview" })).toBeVisible();
          await expect(implementationPage.getByRole("textbox", { name: "Writeup title" })).toHaveValue("Cloud workshop recap");
        } else {
          await expect(implementationPage.getByAltText("Blue placeholder for a cloud workshop photo")).toBeVisible();
          const photoChoices = implementationPage.getByRole("checkbox", { name: "Send for AI caption" });
          await photoChoices.nth(0).check();
          await photoChoices.nth(1).check();
          await expect(implementationPage.getByRole("button", { name: "Overview" })).toBeHidden();
        }
        await expect(implementationPage.getByRole("button", { name: screen.action === "draft-step1" ? /1 Add your notes/ : /2 AI draft/ })).toHaveAttribute("aria-current", "step");
      }
      if (screen.name === "admin") {
        await expect(implementationPage.getByRole("heading", { name: "Admin", exact: true })).toBeVisible();
      }
      await implementationPage.evaluate(async () => { await document.fonts.ready; });
      await implementationPage.waitForTimeout(500);
      const implementation = await implementationPage.screenshot({ fullPage: true });

      const stem = `${screen.name}-${width}`;
      await referencePage.screenshot({ path: resolve(outputDir, `${stem}-mockup.png`), fullPage: true });
      await implementationPage.screenshot({ path: resolve(outputDir, `${stem}-implementation.png`), fullPage: true });

      const comparisonPage = await context.newPage();
      await comparisonPage.setContent(`<!doctype html>
        <html lang="en">
          <head><meta charset="utf-8"><style>
            *{box-sizing:border-box}body{margin:0;padding:12px;font:700 12px Arial,sans-serif;color:#111}
            main{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
            section{min-width:0;border:2px solid #111;padding:6px}
            h1{font-size:12px;margin:0 0 6px;text-transform:uppercase}
            img{display:block;width:100%;height:auto;border-top:1px solid #111}
          </style></head>
          <body><main>
            <section><h1>Approved mockup · ${screen.name} · ${width}px</h1><img alt="Approved mockup" src="data:image/png;base64,${reference.toString("base64")}"></section>
            <section><h1>Current implementation · ${screen.name} · ${width}px</h1><img alt="Current implementation" src="data:image/png;base64,${implementation.toString("base64")}"></section>
          </main></body>
        </html>`);
      await comparisonPage.screenshot({ path: resolve(outputDir, `${stem}-side-by-side.png`), fullPage: true });
      await context.close();
    }
  }
});

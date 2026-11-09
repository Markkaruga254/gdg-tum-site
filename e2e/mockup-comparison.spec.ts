import { mkdir, writeFile } from "node:fs/promises";
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
        await expect(implementationPage.getByRole("button", { name: "Tracks", exact: true })).toHaveCount(0);
        await expect(implementationPage.getByText("Bio", { exact: true })).toHaveCount(0);
        await expect(implementationPage.getByText("Photo URL", { exact: true })).toHaveCount(0);
        const firstUserRow = implementationPage.getByTestId("admin-user-row").first();
        await expect(firstUserRow).toBeVisible();
        const adminColumns = await firstUserRow.evaluate((element) =>
          getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
        );
        expect(adminColumns).toBe(4);
      }

      if (screen.name === "dashboard-new-writeup" && width === 390) {
        await expect(implementationPage.getByTestId("dashboard-sidebar")).toBeVisible();
        const dashboardColumns = await implementationPage.getByTestId("dashboard-layout").evaluate((element) =>
          getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
        );
        expect(dashboardColumns).toBe(2);
      }

      if (screen.name === "dashboard-ai-before" && width === 390) {
        await expect(implementationPage.getByTestId("dashboard-sidebar")).toHaveCount(0);
        const stepColumns = await implementationPage.getByTestId("writeup-stepper").evaluate((element) =>
          getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length,
        );
        expect(stepColumns).toBe(3);
      }

      await implementationPage.evaluate(async () => { await document.fonts.ready; });
      await implementationPage.waitForTimeout(500);
      const implementation = await implementationPage.screenshot({ fullPage: true });
      const referenceViewport = await referencePage.screenshot({ animations: "disabled" });
      const implementationViewport = await implementationPage.screenshot({ animations: "disabled" });

      const stem = `${screen.name}-${width}`;
      await referencePage.screenshot({ path: resolve(outputDir, `${stem}-mockup.png`), fullPage: true });
      await implementationPage.screenshot({ path: resolve(outputDir, `${stem}-implementation.png`), fullPage: true });

      const comparisonPage = await context.newPage();
      const pixelReport = await comparisonPage.evaluate(async ({ referencePng, implementationPng }) => {
        const decode = async (value: string) => {
          const image = new Image();
          image.src = `data:image/png;base64,${value}`;
          await image.decode();
          return image;
        };
        const [referenceImage, implementationImage] = await Promise.all([
          decode(referencePng),
          decode(implementationPng),
        ]);
        if (
          referenceImage.naturalWidth !== implementationImage.naturalWidth ||
          referenceImage.naturalHeight !== implementationImage.naturalHeight
        ) {
          throw new Error("Mockup and implementation viewport screenshots have different dimensions");
        }
        const canvas = document.createElement("canvas");
        canvas.width = referenceImage.naturalWidth;
        canvas.height = referenceImage.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas 2D context is unavailable");
        context.drawImage(referenceImage, 0, 0);
        const referencePixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(implementationImage, 0, 0);
        const implementationPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const heatmap = context.createImageData(canvas.width, canvas.height);
        let changedPixels = 0;
        for (let i = 0; i < referencePixels.length; i += 4) {
          const delta = Math.max(
            Math.abs(referencePixels[i] - implementationPixels[i]),
            Math.abs(referencePixels[i + 1] - implementationPixels[i + 1]),
            Math.abs(referencePixels[i + 2] - implementationPixels[i + 2]),
          );
          if (delta > 24) {
            changedPixels++;
            heatmap.data[i] = 234;
            heatmap.data[i + 1] = 67;
            heatmap.data[i + 2] = 53;
            heatmap.data[i + 3] = 255;
          } else {
            heatmap.data[i] = 255;
            heatmap.data[i + 1] = 255;
            heatmap.data[i + 2] = 255;
            heatmap.data[i + 3] = 255;
          }
        }
        context.putImageData(heatmap, 0, 0);
        const totalPixels = canvas.width * canvas.height;
        return {
          width: canvas.width,
          height: canvas.height,
          changedPixels,
          totalPixels,
          changedRatio: changedPixels / totalPixels,
          heatmapDataUrl: canvas.toDataURL("image/png"),
        };
      }, {
        referencePng: referenceViewport.toString("base64"),
        implementationPng: implementationViewport.toString("base64"),
      });
      await writeFile(
        resolve(outputDir, `${stem}-viewport-diff.png`),
        Buffer.from(pixelReport.heatmapDataUrl.split(",")[1], "base64"),
      );
      const metricSummary = {
        width: pixelReport.width,
        height: pixelReport.height,
        changedPixels: pixelReport.changedPixels,
        totalPixels: pixelReport.totalPixels,
        changedRatio: pixelReport.changedRatio,
      };
      await writeFile(
        resolve(outputDir, `${stem}-viewport-diff.json`),
        JSON.stringify({ screen: screen.name, viewport: width, thresholdPerChannel: 24, ...metricSummary }, null, 2),
      );
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

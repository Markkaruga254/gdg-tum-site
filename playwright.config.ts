import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // Mockup comparison is a manual design-review tool, not a CI acceptance test.
  // Keep it out of the normal functional suite so approved mockups do not block
  // legitimate product and design changes.
  testIgnore: ["**/mockup-comparison.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html", { outputFolder: "playwright-report" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

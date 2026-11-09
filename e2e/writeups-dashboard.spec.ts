import { test, expect } from "@playwright/test";

async function signInAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login?e2e=1");
  await page.getByRole("button", { name: "Sign in as test admin" }).click();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "New writeup" })).toBeVisible();
  await expect(page.locator("#we")).toContainText("Cloud 101 Workshop");
}

test("AI draft and photo caption actions fail closed with setup guidance when App Check is not configured", async ({ page }) => {
  await signInAsAdmin(page);

  await page.getByRole("button", { name: /2 AI draft/ }).click();
  await page.getByRole("button", { name: "Overview" }).click();
  await page.locator("details summary").filter({ hasText: /All writeups/ }).click();
  const draftRow = page.getByText("AI Caption Test Draft", { exact: true }).locator("xpath=../..");
  await draftRow.getByRole("button", { name: "Edit" }).click();

  await expect(page.getByRole("button", { name: "Generate selected captions" })).toBeDisabled();
  await page.getByLabel(/Send for AI caption/).first().check();
  await page.getByLabel(/I confirm that everyone identifiable/).check();
  await expect(page.getByRole("button", { name: "Generate selected captions" })).toBeDisabled();

  await page.getByRole("button", { name: /2 AI draft/ }).click();
  await expect(page.getByText(/AI features are not configured yet/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate AI draft" })).toBeDisabled();
});


test("AI-assisted writeups cannot publish until both review confirmations are saved", async ({ page }) => {
  await signInAsAdmin(page);

  const title = `AI review gate test ${Date.now()}`;
  await page.locator("#we").selectOption("ev-cloud-past");
  await page.getByRole("button", { name: /2 AI draft/ }).click();
  await page.locator("#wt").fill(title);
  await page.locator("#ws").fill("A short summary of an AI-assisted draft used to test the review gate.");
  await page.locator("#body-editor").fill("## Draft\n\nThis is a manually entered test article used to verify the AI review and publication safeguards.");
  await page.getByRole("button", { name: /3 Review & publish/ }).click();
  await page.getByLabel(/This writeup text or its attached photo captions/).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Overview" }).click();
  await page.locator("details summary").filter({ hasText: /All writeups/ }).click();
  let row = page.getByText(title, { exact: true }).locator("xpath=../..");
  await expect(row).toContainText("AI review needed");
  await expect(row.getByRole("button", { name: "Publish" })).toBeDisabled();

  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: /3 Review & publish/ }).click();
  await page.getByLabel(/I have reviewed all AI-assisted article text/).check();
  await page.getByLabel(/I have checked the article's facts/).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Overview" }).click();
  await page.locator("details summary").filter({ hasText: /All writeups/ }).click();
  row = page.getByText(title, { exact: true }).locator("xpath=../..");
  await expect(row).toContainText("AI reviewed");
  await expect(row.getByRole("button", { name: "Publish" })).toBeEnabled();

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Writeup published", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Overview" }).click();
  await page.locator("details summary").filter({ hasText: /All writeups/ }).click();
  row = page.getByText(title, { exact: true }).locator("xpath=../..");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

test("dashboard saves, returns from media, publishes, edits live content, unpublishes and deletes", async ({ page }) => {
  await signInAsAdmin(page);

  const title = `Dashboard workflow test ${Date.now()}`;
  await page.locator("#we").selectOption("ev-cloud-past");
  await page.locator("#wb").fill(
    "The session introduced cloud computing concepts, practical infrastructure choices, secure account habits and the tools members need to continue learning. The notes describe what was covered without assuming every participant completed each step.",
  );
  await page.getByRole("button", { name: /Continue to AI draft/ }).click();

  await expect(page.getByRole("button", { name: "Generate AI draft" })).toBeDisabled();
  await page.locator("#wt").fill(title);
  await page.locator("#ws").fill("A verified recap of a GDG TUM cloud learning session and its practical takeaways.");
  await page.locator("#body-editor").fill(
    "The session introduced core cloud concepts and practical ways to work with cloud infrastructure.\n\n## Key takeaways\n- Understand the service model before choosing a service.\n- Apply least privilege when granting access.\n- Review costs and permissions as part of normal cloud work.",
  );

  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Manage media/ })).toBeVisible();

  await page.getByRole("button", { name: /Manage media/ }).click();
  await expect(page.getByRole("heading", { name: "Media" })).toBeVisible();
  await page.getByRole("button", { name: /Return to writeup/ }).click();
  await expect(page.locator("#body-editor")).toHaveValue(/The session introduced core cloud concepts/);

  await page.getByRole("button", { name: /3 Review & publish/ }).click();
  await page.getByLabel(/I have checked the article's facts/).check();
  await page.getByRole("button", { name: /Publish writeup/ }).click();
  await expect(page.getByText("Writeup published", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Overview" }).click();
  await page.locator("details summary").filter({ hasText: /All writeups/ }).click();
  let row = page.getByText(title, { exact: true }).locator("xpath=../..");
  await expect(row).toContainText("published");
  await expect(row.getByRole("link", { name: /View live/ })).toBeVisible();

  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: /2 AI draft/ }).click();
  await page.locator("#body-editor").fill(
    "The session introduced core cloud concepts and practical ways to work with cloud infrastructure.\n\n## Updated takeaways\n- Understand the service model before choosing a service.\n- Apply least privilege when granting access.\n- Review costs and permissions as part of normal cloud work.",
  );
  await page.getByRole("button", { name: /3 Review & publish/ }).click();
  await page.getByLabel(/I have checked the article's facts/).check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Changes saved; the writeup remains published", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Overview" }).click();
  await page.locator("details summary").filter({ hasText: /All writeups/ }).click();
  row = page.getByText(title, { exact: true }).locator("xpath=../..");
  await expect(row).toContainText("published");

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByText("Writeup unpublished", { exact: true })).toBeVisible();

  row = page.getByText(title, { exact: true }).locator("xpath=../..");
  await expect(row).toContainText("draft");
  await expect(row.getByRole("link", { name: /View live/ })).toHaveCount(0);

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Writeup published", { exact: true })).toBeVisible();

  row = page.getByText(title, { exact: true }).locator("xpath=../..");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

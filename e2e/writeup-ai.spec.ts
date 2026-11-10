import { test, expect } from "@playwright/test";

async function signInAsTestLead(page: import("@playwright/test").Page) {
  await page.goto("/login?e2e=1");
  await page.getByRole("button", { name: "Sign in as test lead" }).click();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
}

test("lead can generate, review and save an editable Gemini writeup draft", async ({ page }) => {
  await signInAsTestLead(page);
  await page.route("**/healthz", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "http://localhost:3000" },
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.getByRole("button", { name: "New writeup", exact: true }).click();
  await page.getByLabel("Event").selectOption("ev-ai-e2e");
  const notes = "We introduced machine learning concepts, discussed model evaluation, and compared training and validation data.";
  await page.getByLabel("Rough notes").fill(notes);

  await page.route("http://writeup-ai.test/v1/writeups/draft", async (route) => {
    const request = route.request();
    const corsHeaders = {
      "access-control-allow-origin": "http://localhost:3000",
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toMatch(/^Bearer\s+/);
    const payload = request.postDataJSON();
    expect(payload.eventId).toBe("ev-ai-e2e");
    expect(payload.notes).toBe(notes);
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      contentType: "application/json",
      body: JSON.stringify({
        draft: {
          title: "Introduction to Machine Learning",
          summary: "A session introducing machine learning concepts and model evaluation.",
          body: "## What we covered\n\nThe session introduced machine learning concepts and model evaluation.",
          topicTags: ["ai-ml"],
          productTags: ["gemini"],
        },
      }),
    });
  });

  await page.getByRole("button", { name: /AI draft/ }).click();
  await page.getByRole("button", { name: "Generate draft with Gemini" }).click();
  await expect(page.getByLabel("Writeup title")).toHaveValue("Introduction to Machine Learning");
  await expect(page.getByLabel("Writeup summary")).toHaveValue("A session introducing machine learning concepts and model evaluation.");
  await expect(page.getByText("AI-assisted · review required")).toBeVisible();

  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved", { exact: true })).toBeVisible();
});

test("lead can request photo captions with consent and apply a reviewed suggestion", async ({ page }) => {
  await signInAsTestLead(page);
  await page.route("**/healthz", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "http://localhost:3000" },
      body: JSON.stringify({ status: "ok" }),
    });
  });
  await page.locator("summary").filter({ hasText: "My writeups" }).click();
  await page.getByTestId("edit-writeup-w-ai-e2e-draft").click();
  await expect(page.getByAltText("Blue placeholder for an AI caption test")).toBeVisible();

  await page.getByLabel("Send for AI caption").first().check();
  await page.getByText("I confirm the people in the ticked photos have agreed.").click();
  // Caption controls are on step 2; photo selection and consent stay selected.
  await page.getByRole("button", { name: /2\s+AI draft/i }).click();
  await expect(page.getByRole("button", { name: "Generate selected photo captions" })).toBeVisible();

  await page.route("http://writeup-ai.test/v1/media/captions", async (route) => {
    const request = route.request();
    const corsHeaders = {
      "access-control-allow-origin": "http://localhost:3000",
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    expect(request.method()).toBe("POST");
    expect(request.headers().authorization).toMatch(/^Bearer\s+/);
    const payload = request.postDataJSON();
    expect(payload.writeupId).toBe("w-ai-e2e-draft");
    expect(payload.mediaIds).toEqual(["m-ai-e2e-1"]);
    expect(payload.consentConfirmed).toBe(true);
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      contentType: "application/json",
      body: JSON.stringify({
        captions: [{
          mediaId: "m-ai-e2e-1",
          caption: "Members collaborating during a technical session.",
          altText: "Participants gathered around a laptop during a session.",
        }],
      }),
    });
  });

  await page.getByRole("button", { name: "Generate selected photo captions" }).click();
  await expect(page.getByText("AI caption suggestions · Review before applying")).toBeVisible();
  await expect(page.getByText("Members collaborating during a technical session.")).toBeVisible();
  await page.getByRole("button", { name: "Apply caption and alt text" }).click();
  await expect(page.getByText("AI caption and alt text applied. You can still edit them in Media.")).toBeVisible();
});

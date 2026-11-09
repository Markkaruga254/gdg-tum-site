# Writeups dashboard: setup and publishing checklist

This guide covers the authoring workflow at `/dashboard`, including Firebase AI Logic, media, review, and publication.

## Firebase AI Logic setup

The site is a Next.js static export on Firebase Hosting. It does not run Next.js API routes, so the dashboard uses the Firebase AI Logic Web SDK directly. It uses the **Gemini Developer API** backend, not the Agent Platform / Vertex AI backend. The Gemini Developer API is the option that can be used on Firebase Spark; model access and quotas still depend on Google's current free-tier eligibility and limits.

1. Open the Firebase project used by the GDG TUM website.
2. In Firebase Console, open **AI Services → AI Logic** and choose **Get started**.
3. Select **Gemini Developer API** as the provider. Complete the guided setup so Firebase enables the Firebase AI Logic API and Gemini Developer API for the project.
4. In Google Cloud Console, create a **score-based reCAPTCHA Enterprise web key** for the website's production domain using the Essentials tier. The current Essentials allowance includes 10,000 assessments per organisation per month without a billing instrument; requests beyond the quota are throttled until the monthly reset. Do not add localhost to the production key's allowed domains.
5. In Firebase Console, open **Security → App Check → Apps**, register the website's Firebase Web App with the reCAPTCHA Enterprise provider, and use the same site key.
6. Add the public site key to the GitHub **production environment variable** `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` (not a secret). The deployment workflow passes it into the static build. The key is public by design; do not put a reCAPTCHA secret or Gemini API key in the frontend.
7. Deploy the updated static site and test an AI action. In **Security → App Check → APIs**, review Firebase AI Logic metrics and confirm the production app is sending valid tokens.
8. Keep the model set to `gemini-3.8-flash` unless you deliberately change `NEXT_PUBLIC_FIREBASE_AI_MODEL` and verify that model's availability and cost first.

Firebase AI Logic requires App Check enforcement. Since 2 November 2026, enforcement is automatically required for Firebase AI Logic. The dashboard lazily initializes App Check with `ReCaptchaEnterpriseProvider` immediately before the first AI request, so ordinary public-site visitors do not trigger reCAPTCHA assessments. AI buttons remain unavailable with a clear setup message if the public site key is missing. The production deployment emits a warning (but does not block the rest of the site) until the GitHub environment variable is configured.

### Local development

1. Add the production reCAPTCHA Enterprise **site key** to your local `.env.local` (never a secret key).
2. Set `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG=true`.
3. Run the app locally and trigger an AI action. The browser console prints an App Check debug token.
4. In Firebase Console → Security → App Check → Apps → your Web App → Manage debug tokens, register that token.
5. Keep the debug token private. Do not commit it, and do not enable debug mode in production.

The CI end-to-end suite uses Firebase emulators and intentionally does not call Gemini. It tests the UI's unconfigured/disabled state and all non-AI dashboard paths without consuming model quota. The Gemini Developer API provider is selected so the project can start on Firebase Spark; the model's own free-tier quota and availability still apply.

## Dashboard workflow

1. Sign in with an authorised lead or admin account and open **Dashboard → New writeup**.
2. Select the event. Track attribution is derived from that event and is not editable by a track lead.
3. Add rough session notes. The AI assistant uses those notes as its source of truth; the event description is context only.
4. Optionally generate an AI draft. Review and edit the title, summary, Markdown body and tags. Regeneration replaces the current generated text, so copy anything you want to retain first.
5. Save a draft at any time. Saving an existing published writeup keeps it published; use **Unpublish** deliberately when you want to take it offline.
6. After saving, use the Media tab to upload event photos, edit captions and alt text, or return to the same writeup. AI photo captions are only generated for photos explicitly selected after the people pictured have consented.
7. In the final review step, disclose AI assistance when it was used and confirm that the article's facts, links, and media permissions have been checked.
8. Publish from the editor or from the Overview list. Published writeups appear at `/writeups` and open at `/writeup?id=<document-id>`.

## Editorial and operational safeguards

- AI output is a draft, never an authority. Verify commands, dates, names, claims and links before publishing.
- The AI prompt explicitly prohibits inventing attendance, participant reactions, quotations, or completed activities.
- AI-assisted writeups cannot be published until a lead confirms review. The disclosure is stored on the writeup and shown on its public page.
- AI photo captions avoid identifying people or inferring sensitive traits. Selected images are sent to Google's model for processing only after the explicit consent checkbox is selected. Photo uploads, caption edits and alt-text edits require the writeup to be a draft; each media change atomically invalidates the parent writeup's final review (and AI review where applicable). Unpublish before changing media on a live writeup.
- Gemini Developer API usage is subject to the project's current free-tier quotas and eligibility. A quota or permission error is surfaced in the dashboard; it is not silently treated as success.
- Cloudinary uploads require `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`. Uploads are limited to JPEG, PNG and WebP files up to 5 MB.
- A removed media record does not delete its underlying Cloudinary asset; deletion from Cloudinary requires a separate trusted server-side workflow.

## Verification

Before release, run:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e:ci
npm run build
```

Then complete one live smoke test with the production App Check registration: generate a short draft, regenerate it, caption one consented photo, save a draft, edit it, publish it, open the public writeup, and unpublish it again. The emulator CI suite cannot prove a live Gemini request or production reCAPTCHA attestation.

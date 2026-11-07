# Phase 1 — implementation, regression and parity report

**Date:** 2026-11-07  
**Repository:** `Markkaruga254/gdg-tum-site`  
**Branch:** `phase/1-foundation`  
**Verified code commit:** `4dc2d61fc444c1552c95b9412b9a4a19e6ff6abd`  
**Pull request:** [#16 — Phase 1: security, shared shell, and reusable primitives](https://github.com/Markkaruga254/gdg-tum-site/pull/16)  
**Disposition:** Implementation and regression checks pass. Exact mockup parity is **UNVERIFIED**; do not describe the screens as pixel-matched or merge on that basis.

## Phase 1 implementation

- Corrected Firestore user, writeup, media and ticker authorization, including negative rules coverage.
- Kept public profile documents email-free on create/update; Google sign-in writes emails to `private_users` and migrates legacy public email fields on the next successful sign-in.
- Prevented admins from changing their own role or track while retaining ordinary self-profile edits.
- Aligned writeup controls with author + current-track-lead permissions; preserved immutable `authorId` and `trackId`; restricted delete to admins.
- Enforced media ownership, ticker event immutability and the 1–140 character message constraint.
- Added the shared frame, canonical wrapping navigation, real-time ticker, footer and reusable UI primitives.
- Reused image-error fallback handling for homepage Moments; no colour layer covers a successfully loaded photo.
- Fixed the empty-Moments guard and made the disabled homepage RSVP label readable.
- Fixed `useCollection` dependencies, retained all required composite indexes, removed app/seed bracket placeholders, and corrected the README/CI deploy-policy discrepancy.
- Removed the automatic Firebase Hosting deploy job. No deploy was run.

## Regression verification

Latest full CI run: [42364329641](https://github.com/Markkaruga254/gdg-tum-site/actions/runs/42364329641)

| Check | Result |
|---|---:|
| ESLint | PASS — 0 errors, 14 warnings |
| TypeScript typecheck | PASS |
| Vitest | PASS — 106 tests across 17 files |
| Firestore emulator rules | PASS — 157 passed, 0 failed |
| Playwright E2E | PASS — 26 tests |
| Responsive overflow | PASS — all 15 routes at 360, 390, 768 and 1280px |
| Static export build | PASS — 18/18 pages generated |
| CodeQL | PASS |
| GitGuardian | PASS |

The CI dependency-audit step is reporting-only/non-blocking and is **not clean**: `npm audit --omit=dev` reports 12 vulnerabilities (8 moderate, 4 high). The full dependency tree reports 20 (16 moderate, 4 high). The suggested `--force` fix would downgrade Firebase to 9.14.0; no breaking forced upgrade was applied. This needs a separate compatibility-reviewed dependency remediation.

## Visual parity matrix

The required mockups and routes are listed below. Every screen remains UNVERIFIED at each required viewport because the CI browser run captured the app but did not open the corresponding `file://` mockup in the same browser session for measured comparison.

| Screen | Route | Source mockup | 1280×1000 | 768×1000 | 390×844 | Overall |
|---|---|---|---|---|---|---|
| Home — populated desktop | `/` | `19-finished-home-populated.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Home — phone | `/` | `20-finished-home-phone.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Lead profile | `/lead?id=...` | `02-lead-profile.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Dashboard — new writeup | `/dashboard` | `03-dashboard-new-writeup.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Dashboard — AI before | `/dashboard` | `06-ai-assistant-before.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Dashboard — draft ready | `/dashboard` | `07-ai-assistant-draft-ready.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Gallery | `/gallery` | `05-gallery.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Leads | `/leads` | `08-leads.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Events | `/events` | `09-events.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Event detail | `/event?id=...` | `10-event-detail.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Tracks | `/tracks` | `11-tracks.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Track detail | `/track?slug=...` | `12-track-detail.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Writeups | `/writeups` | `13-writeups.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Writeup detail | `/writeup?id=...` | `14-writeup-detail.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Blog | `/blog` | `15-blog.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Labs | `/labs` | `16-labs.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Login | `/login` | `17-login.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |
| Admin | `/admin` | `18-admin.html` | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED |

### Evidence and limitations

- The CI responsive-review artifact contains 46 **app-only** screenshots at 1280, 768 and 390px: [download from run 42364329641](https://github.com/Markkaruga254/gdg-tum-site/actions/runs/42364329641/artifacts/13570687631).
- The latest capture has the Next.js development indicator disabled. Manual inspection of the homepage captures confirms the RSVP label is visible and a failed Moments image receives its track-colour fallback.
- The screenshots are not side-by-side app/mockup comparisons and have not been saved as paired evidence under `docs/parity/`.
- No computed-style comparison of font family/size/weight, letter-spacing, colours, borders, spacing or grid metrics has been recorded.
- No pixel-difference percentage has been measured. Therefore no row is labelled MATCH, MINOR or MISMATCH; every row remains UNVERIFIED.
- The responsive E2E tests establish absence of horizontal overflow at the tested widths, not visual parity.
- No production Firebase project or production data was accessed. The per-user legacy-email migration only runs when that user signs in; dormant legacy profiles, if any, still need a separately authorized one-time audit/migration.

## Mismatch / follow-up list

1. Complete browser-based side-by-side comparisons against the exact mockup HTML files at 1280×1000, 768×1000 and 390×844.
2. Record computed-style deviations and pixel-difference percentages, then save paired screenshots under `docs/parity/`.
3. Review and remediate the 12 production-tree dependency vulnerabilities without a forced Firebase downgrade.
4. Before relying on public `users` reads, arrange an authorized audit/migration for any dormant legacy profiles that still contain a public email field.

**Phase boundary:** Phase 1 only. Phase 2 has not started. PR #16 remains a draft and has not been merged. No deployment or production-data operation was performed.

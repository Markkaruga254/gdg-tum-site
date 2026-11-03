# Engineering Audit — gdg-tum-site

**Date:** 2026-11-03
**Phase:** 1 — Project Reconnaissance
**Commits inspected:** 0 (repository has no commits; 53 files staged on `main`)
**Method:** direct source reads, plus executed verification (see [§12 Verification Record](#12-verification-record)). Security-rule conclusions below were confirmed by running the real `firestore.rules` against the Firestore emulator with throwaway probe scripts, not inferred from reading the rules.

---

## 1. Project overview

Marketing + light-CMS website for **GDG on Campus, Technical University of Mombasa** — a student developer club. Four "tracks" (Cloud, Cybersecurity, Web, Women in Tech) each run events; track leads author event "writeups" and can push a "live ticker" message to the public homepage.

Two audiences:

- **Public** — unauthenticated visitors reading events, writeups, leads, and track pages.
- **Members** — Google-authenticated students. Three roles stored in Firestore: `member`, `lead`, `admin`. Leads manage their own track's events/writeups/media/ticker; admins additionally manage all events, all users' roles, and the ticker.

There is no separate backend server. The browser talks to Firestore directly, so **Firestore Security Rules are the only real authorization layer** — client-side gating is cosmetic (see [§10](#10-security-and-configuration-concerns)).

**Maturity:** early prototype. Several UI surfaces are literal placeholder strings (`[Lead name]`, `[Description]`, `[N]`, `[Bio]`), three nav routes are "Coming soon" stubs, and at least one shipped feature (media upload) is non-functional at the rules layer.

---

## 2. Technology stack

| Layer | Choice | Evidence |
|---|---|---|
| Framework | Next.js **16.4.4** (App Router, Turbopack) | [package.json](file:///home/mark/Desktop/gdg-tum-site/package.json) |
| UI | React **19.3.0**, TypeScript **5** (`strict: true`) | [package.json](file:///home/mark/Desktop/gdg-tum-site/package.json), [tsconfig.json:14](file:///home/mark/Desktop/gdg-tum-site/tsconfig.json#L14) |
| Styling | Tailwind CSS **v4** via `@tailwindcss/postcss`, `@theme` tokens | [src/app/globals.css:1](file:///home/mark/Desktop/gdg-tum-site/src/app/globals.css#L1), [postcss.config.mjs](file:///home/mark/Desktop/gdg-tum-site/postcss.config.mjs) |
| Fonts | `next/font/google` — Anton (display) + Space Grotesk (body), CSS variables | [src/app/layout.tsx:5](file:///home/mark/Desktop/gdg-tum-site/src/app/layout.tsx#L5) |
| Auth | Firebase Auth, Google popup sign-in (`signInWithPopup`) | [src/lib/auth.ts:8](file:///home/mark/Desktop/gdg-tum-site/src/lib/auth.ts#L8) |
| Database | Cloud Firestore, accessed **client-side only** | [src/lib/firebase.ts:14](file:///home/mark/Desktop/gdg-tum-site/src/lib/firebase.ts#L14) |
| Authorization | Firestore Security Rules v2 | [firestore.rules](file:///home/mark/Desktop/gdg-tum-site/firestore.rules) |
| Media | Cloudinary **unsigned** preset, direct `XMLHttpRequest` upload from browser | [src/lib/cloudinary.ts:1](file:///home/mark/Desktop/gdg-tum-site/src/lib/cloudinary.ts#L1) |
| Markdown | `react-markdown` (writeup body + dashboard preview) | [src/app/writeup/page.tsx:56](file:///home/mark/Desktop/gdg-tum-site/src/app/writeup/page.tsx#L56) |
| Admin script | `firebase-admin` service account, run via `npx tsx` | [scripts/seed.ts:7](file:///home/mark/Desktop/gdg-tum-site/scripts/seed.ts#L7) |
| Hosting target | Firebase Hosting serving a static export (`out/`) | [firebase.json:2](file:///home/mark/Desktop/gdg-tum-site/firebase.json#L2), [.firebaserc](file:///home/mark/Desktop/gdg-tum-site/.firebaserc) |
| Package manager | npm with a committed `package-lock.json` | repo root |

**Not present:** no ORM/migrations, no API routes, no state-management library, no CSS-in-JS, no Prettier, no test runner (Vitest/Jest/Playwright), no Docker, no `engines` field pinning Node.

**Runtime notes:** local toolchain is Node v24.11.1, npm 11.6.2, Java 24 (Java is a hard requirement for the Firestore emulator). `package.json` does not pin any of these.

---

## 3. Architecture explanation

### Rendering model — static export, fully client-fetched

[next.config.ts:4](file:///home/mark/Desktop/gdg-tum-site/next.config.ts#L4) sets `output: "export"` and `images: { unoptimized: true }`. Consequences, all observed:

- Every one of the 17 routes is `"use client"` and renders `Loading…` at build time. There is **no server component, no RSC payload, no SSR, no ISR** — the exported HTML is an empty shell and all content arrives over Firestore WebSocket/REST after hydration.
- Static export forbids dynamic route segments. Detail pages therefore use **query-string pseudo-routing**: `/event?id=`, `/writeup?id=`, `/lead?id=`, `/track?slug=`. This is deliberate and documented in the README, and each such page correctly wraps `useSearchParams` in `<Suspense>`.
- `images.unoptimized` means `next/image` gives no benefit, so raw `<img>` tags are used (3 lint warnings) — acceptable given the host, but it means no resizing of Cloudinary originals.
- Static export also means **no server-side secret of any kind exists at runtime**. Admin role changes, event writes and media writes all originate from the browser and are governed only by rules.

### Layering

```
src/lib/firebase.ts     initializeApp + getFirestore (module singleton, getApps guard)
src/lib/auth.ts         Google popup sign-in; lazily creates users/{uid} + private_users/{uid}
src/lib/types.ts        7 domain interfaces (Track, Event, Writeup, AppUser, Post, Ticker)
src/lib/cloudinary.ts   unsigned browser upload with XHR progress
src/components/*        8 presentational components (Nav, Footer, TickerBar, Tag, BorderCard,
                        NumberedRow, SectionLabel, form/FormField)
src/app/*/page.tsx      15 routes; each fetches Firestore inline inside useEffect
src/app/dashboard/*     469-line multi-tab lead/admin console (the whole CMS)
```

Data access is **not abstracted**: each page inlines `collection()`/`query()`/`getDocs()` calls and re-maps `{ id: d.id, ...d.data() }` by hand. There is no repository/service layer, no shared fetch hook, and no centralised error surface — each page repeats its own `try/catch/finally` (or omits the `catch`; see [§8](#8-technical-debt)).

### Authorization flow

1. `signInGoogle()` ([src/lib/auth.ts:8-19](file:///home/mark/Desktop/gdg-tum-site/src/lib/auth.ts#L8-L19)) pops a Google window, then — only if the doc is missing — writes `users/{uid}` with `role: "member"` and `private_users/{uid}` with the email.
2. Privileged pages re-read `users/{uid}` inside an `onAuthStateChanged` listener and set a boolean `allowed` ([src/app/dashboard/page.tsx:40-50](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L40-L50), [src/app/admin/page.tsx:19-33](file:///home/mark/Desktop/gdg-tum-site/src/app/admin/page.tsx#L19-L33)).
3. Because routes are static files, **unauthorized users can still load `/dashboard` and `/admin`**; they render "Not allowed." after the role read resolves. The route itself is public and its JS bundle is downloadable by anyone.

### Identity model inconsistency (root cause of several defects)

A `Track` has both an auto-generated Firestore document id *and* a `slug` field, and `AppUser.track` / `Event.trackId` are typed as `TrackSlug` (a slug string). Writers and readers disagree about which one is meant:

- **Writers** store slugs: [src/app/dashboard/page.tsx:87](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L87) persists `trackId: role === "admin" ? eventForm.trackId : track`, where the select's options are literal slugs ([src/app/dashboard/page.tsx:207](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L207)); [scripts/seed.ts:23-25](file:///home/mark/Desktop/gdg-tum-site/scripts/seed.ts#L23-L25) seeds `trackId: "cloud"`.
- **Readers** sometimes compare against the doc id: [src/app/track/page.tsx:29-31](file:///home/mark/Desktop/gdg-tum-site/src/app/track/page.tsx#L29-L31) queries `events where trackId == t.id` and `writeups where trackId == t.id`. With slug-valued data these queries return **empty**, so the track detail page shows no events and no writeups.
- [src/app/writeups/page.tsx:36](file:///home/mark/Desktop/gdg-tum-site/src/app/writeups/page.tsx#L36) papers over it with a dual lookup — `tracks.find((t) => t.id === slug || t.slug === slug)` — which is the clearest signal that the ambiguity is already causing defects.

---

## 4. Repository structure

```
gdg-tum-site/
├── .env.example                 9 required vars, all blank
├── .env.local                   LOCAL ONLY, git-ignored, contains live client config
├── .firebaserc                  default project: gdg-tum-site
├── firebase.json                hosting -> out/, firestore rules + indexes
├── firestore.rules              41 lines, 7 collection matches + catch-all deny
├── firestore.indexes.json       2 composite indexes
├── next.config.ts               output: export, images unoptimized
├── eslint.config.mjs            flat config, next core-web-vitals + typescript
├── tsconfig.json                strict, bundler resolution, @/* -> src/*
├── package.json                 7 scripts, 5 deps, 10 devDeps
├── scripts/
│   ├── seed.ts                  40 lines, service-account write to Firestore
│   └── test-rules.mjs           29 lines, the entire automated test suite
├── public/                      5 unused Next.js boilerplate SVGs
├── src/
│   ├── app/                     15 routes + layout + globals.css
│   │   └── dashboard/page.tsx   469 lines — largest file in the repo
│   ├── components/              8 components
│   ├── hooks/useAsyncAction.ts  14 lines — UNREFERENCED
│   └── lib/                     4 modules
└── (no docs/, no .github/, no tests/ dir)
```

**Untracked local artifacts present on disk but correctly ignored:** `.next/`, `out/`, `firestore-debug.log`.
**Tracked-but-shouldn't-be:** see [§8](#8-technical-debt) — `.firebase/hosting.b3V0.cache` and `tsconfig.tsbuildinfo` (179 KB) are both currently **staged**.

---

## 5. Existing feature inventory

### Working (code path complete)

| Feature | Location |
|---|---|
| Google sign-in / sign-out, first-login profile bootstrap | [src/lib/auth.ts:8](file:///home/mark/Desktop/gdg-tum-site/src/lib/auth.ts#L8) |
| Public events list + client-side track filter | [src/app/events/page.tsx:28](file:///home/mark/Desktop/gdg-tum-site/src/app/events/page.tsx#L28) |
| Event detail by `?id=` | [src/app/event/page.tsx:11](file:///home/mark/Desktop/gdg-tum-site/src/app/event/page.tsx#L11) |
| Published writeups list, writeup detail with markdown + related + media gallery | [src/app/writeup/page.tsx:26](file:///home/mark/Desktop/gdg-tum-site/src/app/writeup/page.tsx#L26) |
| Leads directory + lead profile page | [src/app/leads/page.tsx:18](file:///home/mark/Desktop/gdg-tum-site/src/app/leads/page.tsx#L18) |
| Live ticker (real-time `onSnapshot`, hides when empty) | [src/components/TickerBar.tsx:9](file:///home/mark/Desktop/gdg-tum-site/src/components/TickerBar.tsx#L9) |
| Dashboard: create/update/delete events, with per-field validation | [src/app/dashboard/page.tsx:70-112](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L70-L112) |
| Dashboard: writeup draft/publish/unpublish/edit/delete, markdown preview, link list | [src/app/dashboard/page.tsx:114-166](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L114-L166) |
| Dashboard: self-profile edit incl. Cloudinary photo upload, type + 5 MB size guard | [src/app/dashboard/page.tsx:421-469](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L421-L469) |
| Admin: change any user's role and track, with self-demotion guard | [src/app/admin/page.tsx:35-44](file:///home/mark/Desktop/gdg-tum-site/src/app/admin/page.tsx#L35-L44) |
| Data seeding | [scripts/seed.ts](file:///home/mark/Desktop/gdg-tum-site/scripts/seed.ts) |

### Broken or dead — verified

| # | Finding | Evidence |
|---|---|---|
| F1 | **Media upload cannot persist.** `/media` has **no write rule at all** ([firestore.rules:36-38](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L36-L38) declares `allow read` only, and the catch-all denies everything else). The dashboard's Media tab calls `addDoc(collection(db,"media"))` ([src/app/dashboard/page.tsx:312](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L312)) and `updateDoc` for captions ([src/app/dashboard/page.tsx:320](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L320)). Emulator-verified: **denied for admin and lead alike.** Worse, the Cloudinary upload completes first, so every attempt orphans an image in the account before failing. | probe H1 |
| F2 | **Track leads cannot use the Live ticker.** [firestore.rules:19](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L19) reads `isLeadOf(request.resource.data.eventId == null ? "" : "")` — a self-nullifying ternary that yields `""` on **both** branches, so `isLeadOf("")` can never be true. Emulator-verified: lead create/update/delete on `ticker` all **denied**; only `isAdmin()` works. The "Go live during the event" flagship flow is admin-only in practice. | probe H2 |
| F3 | **Leads cannot delete their own events.** [firestore.rules:15](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L15) evaluates `request.resource.data.trackId` for `delete`, but `request.resource` is null on delete → "Null value error" → denied. The dashboard nonetheless renders a Delete button for leads ([src/app/dashboard/page.tsx:225](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L225)). Emulator-verified: lead delete **denied**, admin delete allowed. Same pattern makes lead writeup-delete fail, though that one *is* admin-only by rule ([src/app/dashboard/page.tsx:288](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L288) shows the button regardless of role). | probe H3 |
| F4 | **The homepage "Tech blog" section can never render, and errors on every visit.** [src/app/page.tsx:33](file:///home/mark/Desktop/gdg-tum-site/src/app/page.tsx#L33) queries the `posts` collection, but `posts` has **no rules match** (falls through to [firestore.rules:39](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L39)) and **no code ever writes it** (`grep '"posts"'` matches that one read). Emulator-verified denied for anon *and* admin. Browser-verified against the live project: homepage console logs `Missing or insufficient permissions.` twice, because the `try`/`finally` at [src/app/page.tsx:26-38](file:///home/mark/Desktop/gdg-tum-site/src/app/page.tsx#L26-L38) has **no `catch`**, so the rejection escapes the effect. | probe H4 + Playwright |
| F5 | **Track detail pages are empty.** Slug-vs-doc-id mismatch described in [§3](#3-architecture-explanation): [src/app/track/page.tsx:29-31](file:///home/mark/Desktop/gdg-tum-site/src/app/track/page.tsx#L29-L31) queries by `t.id` while all writers store the slug. | code read |
| F6 | **`/tracks` and the homepage track list ignore the database.** [src/app/tracks/page.tsx:5-10](file:///home/mark/Desktop/gdg-tum-site/src/app/tracks/page.tsx#L5-L10) and [src/app/page.tsx:13-18](file:///home/mark/Desktop/gdg-tum-site/src/app/page.tsx#L13-L18) hardcode duplicated track arrays with `[Lead name]` / `[Description]` placeholders, while `/track` reads the `tracks` collection — three sources of truth, two of them static. | code read |
| F7 | **Newsletter subscribe does nothing.** [src/components/Footer.tsx:8-9](file:///home/mark/Desktop/gdg-tum-site/src/components/Footer.tsx#L8-L9): an `<input>` plus a `Subscribe` button with no `<form>`, no handler, no state; social links are `href="#"` dead anchors. The input is also not `type="email"`, so no validation. | code read |
| F8 | **Dead code.** [src/hooks/useAsyncAction.ts](file:///home/mark/Desktop/gdg-tum-site/src/hooks/useAsyncAction.ts) is imported by nothing; `TrackSlug`, `TrackColor`, `Ticker` in [src/lib/types.ts](file:///home/mark/Desktop/gdg-tum-site/src/lib/types.ts) are referenced only inside that same file. `Ticker` even omits the `createdBy` field that rules and the dashboard both depend on. | grep |
| F9 | **Unfinished features shipped as UI.** RSVP button permanently `disabled` with "(soon)" copy ([src/app/page.tsx:70](file:///home/mark/Desktop/gdg-tum-site/src/app/page.tsx#L70)); "Generate draft with AI (coming soon)" ([src/app/dashboard/page.tsx:270](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L270)); `/blog`, `/labs` are "Coming soon." stubs, `/dashboard` Overview tab renders the literal string `Overview`; Labs stat is a hardcoded `[0]` and Members stat `[N]`. `attendance`/`rsvpCount`/`links` fields exist in writes but appear in no `types.ts` interface. | code read |

---

## 6. Testing infrastructure assessment

**Total automated coverage: one 29-line script.** `npm test` does not exist; there is no unit, component, integration, or E2E test anywhere.

### What `scripts/test-rules.mjs` actually validates

Run via `npm run test:rules` → `firebase emulators:exec --only firestore "node scripts/test-rules.mjs"`. Five assertions, executed in sequence:

1. `assertFails` — member cannot create an event ✔
2. `assertFails` — member cannot promote self to admin ✔
3. `assertSucceeds` — owner can read own `private_users` doc ✔
4. `assertFails` — another user cannot read that `private_users` doc ✔
5. (implicit) unauthenticated reads of `writeups` drafts — **not tested**

Verified run output: `ALL RULE TESTS PASSED`, exit 0.

**Structural problems with it:**

- **`assertFails` passes for the wrong reason.** The emulator log for assertion 1 reads `evaluation error at L15:40` — the rule is denied because the expression *crashed*, not because a predicate correctly evaluated false. The suite therefore cannot distinguish "access denied by design" from "rules file is broken". F2/F3 are exactly this class of bug, and the suite reports green.
- **README claims more than the code proves.** The "Manual rules test checklist" lists four cases; only two are automated. "Lead cannot edit another track" and "Public cannot read drafts" are unverified — and the *inverse* of the first (leads cannot edit **any** track, F2/F3) is the actual current behaviour.
- **No test framework.** Top-level `await` in a `.mjs` file with zero asserts-library, so failures abort the whole run at the first throw, no per-test isolation, no reporting, no `.only`/`.skip`, no fixtures. `await env.cleanup()` at line 28 is skipped on any throw, leaking the emulator session.
- **No deterministic seeding.** Each test inlines its own `withSecurityRulesDisabled` writes; there are no reusable admin/lead/member fixtures.
- **Positive paths are entirely untested.** Nothing asserts that a lead *can* do the things the dashboard offers — which is why F1–F3 survived.

**Exit-code behaviour was verified and is sound:** a deliberately failing child script propagates through `emulators:exec` (`exit = 3`, `Script exited unsuccessfully`). This gate can fail a pipeline; it just has almost nothing in it.

**Toolchain burden:** the suite needs Java plus a ~10-second emulator JVM boot, making the fastest test in the repo the slowest to install.

---

## 7. CI/CD assessment

**There is no CI.** No `.github/`, `.gitlab-ci.yml`, `.circleci`, `azure-pipelines.yml`, no `vercel.json`/`netlify.toml`, no git hooks, no pre-commit runner.

Deployment is a manual, two-word local command from the README: `npm run build && firebase deploy --only hosting,firestore:rules`, run from an unversioned working tree with the Firebase CLI already authenticated against the live project. There is no staging site — `.firebaserc` names exactly one project (`gdg-tum-site`) — so a bad deploy goes straight to production and there is no defined rollback path.

**Good news:** every quality gate that CI would want already runs green locally and needs no code changes to exist (see [§12](#12-verification-record)). `npm run lint` works as a bare `eslint` command against the project root (flat config, exit 0), `npm run typecheck` is exit 0, `npm run build` produces 17 static pages. The gap is purely orchestration, not capability.

**Constraints a pipeline must respect:**

- `test:rules` requires a JRE and the Firebase CLI.
- The build embeds `NEXT_PUBLIC_*` at compile time, so a CI build must be given the same env values it will run with — a staging build cannot be promoted to production by swapping env at runtime.
- A production credential (`GOOGLE_APPLICATION_CREDENTIALS`) is needed for seeding only; CI must never hold it.
- No E2E target exists yet, and the app has no staging project to safely test against.

---

## 8. Technical debt

### Repo hygiene (blocks the very first commit)

- **Two generated artifacts are staged:** `tsconfig.tsbuildinfo` (179 KB incremental-build cache) and `.firebase/hosting.b3V0.cache` (10 KB deploy file-hash cache, containing MD5/SHA256 digests of a previous `out/` build). `.gitignore` covers `out/`, `.next/` and `*.log` but **not** `*.tsbuildinfo` or `.firebase/`. If committed, both will churn on every build and produce permanent diffs.
- `next-env.d.ts` is staged *and* modified (`AM` in status) — Next rewrites it during build/typecheck.
- `public/` still holds all five untouched Next.js boilerplate SVGs (`file/globe/next/vercel/window`).
- **Zero commits exist.** No history, no tags, no protected branch, no contributor baseline.
- No `engines` field in `package.json`; Node 24 / npm 11 are only implicit.

### Typing and safety

- `strict: true` is on, yet the largest and most security-sensitive file defeats it wholesale: [src/app/dashboard/page.tsx:2](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L2) and [src/app/admin/page.tsx:2](file:///home/mark/Desktop/gdg-tum-site/src/app/admin/page.tsx#L2) file-level `eslint-disable @typescript-eslint/no-explicit-any`, plus 3 more in [src/app/writeup/page.tsx](file:///home/mark/Desktop/gdg-tum-site/src/app/writeup/page.tsx) and 1 each in 4 other files. Form state, Firestore documents, and every `catch (e: any)` are untyped; the typed interfaces in `src/lib/types.ts` are used for reads only, never for writes.
- No runtime validation of any Firestore document. Every read is an unchecked cast `{ ...d.data() } as Event`. A schema drift produces silent `undefined` rendering, not an error.
- No shared validation module: URL-shape checks (`/^https?:\/\//`) are duplicated in two places ([src/app/dashboard/page.tsx:121](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L121), [src/app/dashboard/page.tsx:436](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L436)), size limits in two, MIME lists in two — and the events form checks none of the `links` it writes.
- `src/lib/types.ts` disagrees with what is written: `AppUser.track` is typed `TrackSlug` (non-nullable) but rules, seed, and `ProfileTab` all treat `track: null` as valid; `Event`/`Writeup` omit `attendance`/`links` that `saveWriteup` persists.

### UI architecture

- [src/app/dashboard/page.tsx](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx) is 469 lines with **16 `useState` hooks in one component**, mixing five tab panels, two form lifecycles, and all CRUD handlers. The three sub-components at the bottom (`TickerTab`, `ProfileTab`) receive `setMsg`/`setErr` setters as props — state ownership is leaking rather than encapsulated.
- Two diverged implementations of the same "profile editor" exist: [src/app/admin/page.tsx:65-79](file:///home/mark/Desktop/gdg-tum-site/src/app/admin/page.tsx#L65-L79) (`UserRow`) and [src/app/dashboard/page.tsx:421-469](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L421-L469) (`ProfileTab`) — same fields, different validation, no shared component.
- No React error boundary anywhere; no loading skeleton or empty-state component despite 12 pages each hand-rolling `Loading…` / `No events.` strings.
- Every page repeats `<Nav/> … <Footer/>` manually (15 copies) instead of using a layout — and there is **no `loading.tsx`, `error.tsx`, or `not-found.tsx`** in any `src/app/` segment.
- Data fetching never deduplicates or caches: `/writeup` fires 4 sequential round-trips in series ([src/app/writeup/page.tsx:26-37](file:///home/mark/Desktop/gdg-tum-site/src/app/writeup/page.tsx#L26-L37)) instead of `Promise.all`, and `loadEvents()` refetches the entire events collection per tab.
- `await loadEvents()` / `loadWriteups()` are called from an effect body without being listed deps ([src/app/dashboard/page.tsx:68](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L68), suppressed by lint-disable) — a stale-closure risk in the code most likely to regress.
- Destructive actions use `window.confirm()` (5 sites), which is untestable in Playwright without dialog handlers and inaccessible to many users.
- No pagination or `limit()` on public list pages ([src/app/events/page.tsx:18](file:///home/mark/Desktop/gdg-tum-site/src/app/events/page.tsx#L18), [src/app/writeups/page.tsx:22](file:///home/mark/Desktop/gdg-tum-site/src/app/writeups/page.tsx#L22)) — full-collection downloads that grow without bound.

### Documentation

- [README.md](file:///home/mark/Desktop/gdg-tum-site/README.md) has a **duplicated `## Deploy` section** (two identical command blocks) and a `# project id` typo (`"indexes":"firestore.indexes.json"` missing a space in [firebase.json:12](file:///home/mark/Desktop/gdg-tum-site/firebase.json#L12)).
- The README's "Manual rules test checklist" overstates automated coverage ([§6](#6-testing-infrastructure-assessment)).
- No `docs/`, `CONTRIBUTING`, or `ARCHITECTURE` before this audit. The "First admin bootstrap" step is documented only in one README line.

---

## 9. Potential regression risks

Ordered by likelihood × blast radius.

1. **Rule edits are invisible until runtime.** The suite passes on evaluation errors ([§6](#6-testing-infrastructure-assessment)), so a rules change can silently lock an entire role out of a feature — which is already the situation for media, ticker, and event-delete (F1–F3). Any future rule work inherits this blind spot.
2. **Slug/doc-id ambiguity (`trackId`).** Because both spellings are in circulation, changing either the seed, the dashboard select, or `track/page.tsx` in isolation will fix one page and break another. This is the single most likely accidental regression in the codebase.
3. **Auth-bootstrap race in `signInGoogle`.** [src/lib/auth.ts:14-17](file:///home/mark/Desktop/gdg-tum-site/src/lib/auth.ts#L14-L17) does read-then-write with no transaction and no offline persistence. Two tabs/devices signing in for the first time can both see `!snap.exists()`; more importantly, a user whose profile write fails while the `private_users` write succeeds (or vice versa) is left half-provisioned, and the guard never retries because the check is `if (!snap.exists())`. A `getDoc` failure here is also **uncaught**, so sign-in hangs with no message.
4. **Admin lockout is recoverable only by console access.** [src/app/admin/page.tsx:37](file:///home/mark/Desktop/gdg-tum-site/src/app/admin/page.tsx#L37) blocks self-demotion, which is right, but there is no second-admin invariant and no break-glass other than the manual README step. Removing the last admin yields an unmanageable site.
5. **Static export + query-string routing means no 404s and no per-page metadata.** Detail pages render "Not found." client-side ([src/app/event/page.tsx:29](file:///home/mark/Desktop/gdg-tum-site/src/app/event/page.tsx#L29)) but return HTTP 200; `metadata` is export-level only ([src/app/layout.tsx:8](file:///home/mark/Desktop/gdg-tum-site/src/app/layout.tsx#L8)), so no page can gain title/description/OG tags. Any future move to SSR or dynamic routes touches every one of the 15 pages.
6. **Firebase JS SDK v11 and Next 16 / React 19 are unpinned minors** (`firebase: ^11.0.0`, `@types/react: ^19`, `typescript: ^5`), so `npm install` on a clean machine can drift from the lockfile's tested versions. `next` and `react` are pinned; the security-critical `firebase`/`firebase-admin` pair is not.
7. **Homepage's missing `catch`** (F4) means a Firestore hiccup on *any* of its three queries produces an unhandled rejection instead of a UI state; the section silently shows stale/empty content with no signal to users or monitoring.
8. **`role()` costs two extra document reads per operation** ([firestore.rules:5,7](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L5)) and is invoked inside per-document evaluation, so list queries multiply read cost; a rules refactor toward custom claims would change every rule at once.
9. **Cloudinary orphaning** ([src/app/dashboard/page.tsx:305-312](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L305-L312)): the Firestore write is not transactional with the upload, and the UI openly tells users "file stays in Cloudinary" ([src/app/dashboard/page.tsx:322](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L322)) — deleting a media doc never deletes the asset, so storage grows forever.
10. **No E2E net under a 15-route client-only app.** With zero integration coverage, regressions in sign-in, publishing, and the ticker are only discoverable by hand.

---

## 10. Security and configuration concerns

### Verified by emulator probes

| Concern | Status | Detail |
|---|---|---|
| Self-service role escalation | **Held ✔** | `member` self-update of `role` → denied; `bio`-only self-update → allowed; creating a `users/{otherUid}` doc → denied. [firestore.rules:23-24](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L23-L24) |
| Email protection | **Held ✔** | `private_users` anon read denied, owner read allowed. Correctly separated from `users`. [firestore.rules:27-28](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L27-L28) |
| Draft writeups hidden from public | **Held ✔** | anon `getDoc` of a `status: "draft"` writeup → denied. [firestore.rules:31](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L31) |
| Default-deny catch-all | **Present ✔** | [firestore.rules:39-40](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L39-L40) — the single best property of the rules file; `posts` and any future collection are closed until declared. |
| **`users` is world-readable** | **Concern** | [firestore.rules:22](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L22) `allow read: if true`, emulator-verified for anon. Exposes every member's **role** and track, plus photo URL, bio and links, to anonymous enumeration of `users/{uid}`. Publishing the role matrix is a low-cost reconnaissance gift and an unintended HR-ish disclosure. |
| **Events are world-readable and unfiltered** | **Concern** | [firestore.rules:14](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L14) `allow read: if true` — no `status` distinction, so internal/`draft`-ish event data has no confidentiality at all. Fine for published-only; must be confirmed as intentional. |
| **Leads can self-publish without review** | **Concern** | `status: "published"` on create is emulator-verified as allowed for a lead in their own track ([firestore.rules:32](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L32)), even though the UI frames publishing as an admin-adjacent flow. |
| **Unsigned Cloudinary preset** | **Acknowledged debt** | [src/lib/cloudinary.ts:3](file:///home/mark/Desktop/gdg-tum-site/src/lib/cloudinary.ts#L3) + README "Known limitations". Anyone who reads the bundle can extract the preset from `NEXT_PUBLIC_*` and upload unlimited images to the club's account — quota, cost, and hosted-content risk. No folder path, no signature, no `max_size` server-side enforcement. |
| **Rules are the only boundary** | **Architecture** | Static export ⇒ no middleware, no API layer, no server checks. The `allowed` flags in [src/app/dashboard/page.tsx:169](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L169) and [src/app/admin/page.tsx:47](file:///home/mark/Desktop/gdg-tum-site/src/app/admin/page.tsx#L47) are UX, and `/dashboard` + `/admin` HTML/JS are publicly fetchable. Any rules hole is directly exploitable by curl. |
| **No rate limiting / abuse controls** | **Gap** | Nothing throttles `signInGoogle` profile creation, list enumeration, or `addDoc` spam from a signed-in `member`. |
| XSS via markdown | **Low ✔** | `ReactMarkdown` does not emit raw HTML by default and no `rehype-raw` is configured ([src/app/writeup/page.tsx:56](file:///home/mark/Desktop/gdg-tum-site/src/app/writeup/page.tsx#L56)). Residual risk is `javascript:` URLs inside link-only content (rendered as text, not anchors) and the un-sanitised `<a href={l.url}>` in [src/app/lead/page.tsx:49](file:///home/mark/Desktop/gdg-tum-site/src/app/lead/page.tsx#L49) / [src/app/leads/page.tsx:38](file:///home/mark/Desktop/gdg-tum-site/src/app/leads/page.tsx#L38), where only the *writing* path validates `http(s)://` — data seeded directly in Firestore bypasses that. |
| Image alt/`src` from Firestore | **Low** | `<img src={m.url}>` ([src/app/writeup/page.tsx:62](file:///home/mark/Desktop/gdg-tum-site/src/app/writeup/page.tsx#L62)) trusts stored URLs; combined with the row above, an unconstrained write could point at an arbitrary host. |
| Dependency vulnerabilities | **Real but largely unactionable** | `npm audit`: 29 advisories (12 in production deps; 8 moderate, 4 high). All high-severity entries resolve through the `firebase` → `@firebase/firestore` → `@grpc/grpc-js` chain, plus `@firebase/rules-unit-testing`. npm's only offered fix is **downgrading `firebase` to 9.14.0**, a semver-major downgrade that would break the v11 API surface the app uses. `eslint`/`eslint-config-next` are flagged as dev-only. Needs a triage decision, not `audit fix --force`. |

### Configuration concerns

- **`NEXT_PUBLIC_*` is public by design**, and the app has no server to hold secrets — so *every* client config value is disclosed to visitors. This is inherent to the architecture, not a leak, but it makes the Cloudinary preset and the project id permanent public facts.
- `.env.example` lists `GOOGLE_APPLICATION_CREDENTIALS` alongside client vars, inviting a service-account path in the same file used for public config. Local `.env.local` currently holds only the six public vars — **no secret material is committed**, and `.gitignore` correctly covers `.env.*` with an `!.env.example` exception plus explicit `service-account*.json` / `*-firebase-adminsdk-*.json` patterns.
- No validation that the six `NEXT_PUBLIC_FIREBASE_*` vars exist. [src/lib/firebase.ts:4-13](file:///home/mark/Desktop/gdg-tum-site/src/lib/firebase.ts#L4-L13) will happily `initializeApp` with `undefined` fields, deferring failure to a confusing runtime Firestore error. [src/lib/cloudinary.ts:2-3](file:///home/mark/Desktop/gdg-tum-site/src/lib/cloudinary.ts#L2-L3) uses non-null `!` assertions, so a missing preset yields `undefined` in a URL rather than a clear message.
- `.firebaserc` + `firebase.json` define a **single production project with no staging**, and `firebase.json` has no `hosting.headers`/caching rules and no `emulators` block.
- `package.json` has no `test` script, so a CI `npm test` step would fail; `lint` relies on ESLint 9 defaulting a bare invocation to the project root.
- No `robots.txt`, no `sitemap.xml`, no `security.txt`; `public/` ships framework boilerplate.

**No credential or secret was reproduced in this report.** Live values in `.env.local` were read only as key names.

---

## 11. Recommended engineering improvements

### Phase A — commit hygiene gate (before the first commit)

1. Add `*.tsbuildinfo`, `.firebase/`, and `next-env.d.ts` handling to `.gitignore`; unstage `tsconfig.tsbuildinfo` and `.firebase/hosting.b3V0.cache`; remove the five unused boilerplate SVGs from `public/`.
2. Make the initial commit as a coherent baseline, then work on feature branches.

### Phase B — fix verified broken functionality (highest user value per line changed)

3. **Write rules for `/media`** (create/update/delete for the writeup's author, lead of its track, or admin) — closes F1 and unblocks the Media tab; also stop orphaning Cloudinary assets by writing the Firestore doc *before* uploading, or deleting the asset on write failure.
4. **Fix the ticker rule** — replace the self-nullifying ternary at [firestore.rules:19](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L19) with a real track lookup through the referenced event (F2). This restores the "go live during the event" flow to leads.
5. **Fix the delete rules** so `delete` never reads `request.resource` ([firestore.rules:15](file:///home/mark/Desktop/gdg-tum-site/firestore.rules#L15) — use `resource.data.trackId`), and hide Delete buttons for actions the rules forbid (F3).
6. **Decide `posts`** — either add rules + a writer, or remove the query and the homepage blog section (F4). Whichever is chosen, add the missing `catch` at [src/app/page.tsx:26](file:///home/mark/Desktop/gdg-tum-site/src/app/page.tsx#L26).
7. **Pick one meaning for `trackId`** (recommendation: the `tracks` document id, with `slug` for URLs only) and update writers, readers, seed, and the dashboard select together (F5).

### Phase C — make testing real

8. Replace `scripts/test-rules.mjs` with a **Vitest** suite (`npm test`) using `@firebase/rules-unit-testing` and `initializeTestEnvironment({ firestore: { rules, rulesElevationFlag: false } })`: one test per rule, with `assertSucceeds` positive paths for every role, and explicit `firestore().settings()` isolation. Crucially, assert on the **denial reason** (or use `withRulesElevated` for setup) so a rules *evaluation error* fails rather than passes.
9. Seed deterministic fixtures in a `beforeEach` (admin / lead-of-cloud / lead-of-web / member / anon) instead of inlining them per assertion.
10. Add Vitest + `@testing-library/react` **unit tests** for pure logic first: extract and test the `validateEvent`/`validateWriteup` validators, `signInGoogle`'s provisioning branch, and the `Tag`/`trackColor` mapping. Mock `firebase`/`firestore` at the module boundary.
11. Add **Playwright E2E** for the three journeys that matter: (a) anonymous visitor → homepage + events + writeup detail render from seeded data; (b) lead sign-in → create event → draft writeup → publish → it appears publicly; (c) member sign-in → `/dashboard` and `/admin` show "Not allowed" **and** direct Firestore writes are rejected. Requires an isolated Firebase project or the emulator — see D3.
12. Adopt the regression protocol: reproduce, failing test first, fix, then the whole suite.

### Phase D — CI

13. Add `.github/workflows/ci.yml` on `pull_request` to `main` + `push` to `main`, with `permissions: contents: read`, `concurrency` cancel-in-progress, and `actions/*` pinned to SHAs. Stages, in order: setup (Node 24 + npm cache keyed on `package-lock.json`) → `npm ci` → `npm run lint -- --max-warnings=0` → `npm run typecheck` → `npm test` (Vitest unit + rules) → `npm run build` → **upload `out/` as an artifact**.
14. Add a second workflow (or job) for Playwright E2E that starts `firebase emulators:exec --only firestore,auth` — this requires a Java step and a Firebase-CLI install — plus `npm audit --omit=dev` as a *reporting* step until the firebase v11 advisories are triaged, so it doesn't permanently red-gate the build on an unfixable advisory.
15. Add a staging Firebase project (or emulator-only preview) so no automated job can reach production, and gate deploys behind branch protection. Recommend branch protection/rulesets as a separate, approval-required change — I have not touched remote settings.

### Phase E — structural debt (only after A–D are green)

16. Extract a `src/lib/data.ts` query layer and a `useCollection` hook so pages stop hand-casting; give writes real types via `src/lib/types.ts` and one shared `validators.ts`.
17. Split the 469-line dashboard into one component per tab with owned state; unify `ProfileTab`/`UserRow` into one profile editor.
18. Reconcile hardcoded track/blog arrays so Firestore is the single source of truth (F6); implement or remove the newsletter form (F7); delete dead code (`useAsyncAction.ts`) or wire it up.
19. Add `loading.tsx`/`error.tsx`/`not-found.tsx`, a shared layout that renders `Nav`/`Footer` once, and `robots.txt` + `sitemap.xml`.
20. Replace `window.confirm` with an in-app dialog; add pagination/`limit()` to public lists; parallelise `/writeup`'s four serial fetches.
21. Move to signed Cloudinary uploads behind a Function, or drop Cloudinary for Firebase Storage with rules-scoped writes.
22. Consider custom Auth claims for role (removes 2 reads per rule evaluation) — an architectural change requiring its own migration plan and approval.

### Documentation to add

`docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/CONTRIBUTING.md`, `docs/CI_CD.md`; fix the duplicated README `## Deploy` block and align the "Manual rules test checklist" with what is actually automated.

---

## 12. Verification Record

Executed locally, read-only, no application code modified:

| Check | Command | Result |
|---|---|---|
| Type check | `npx tsc --noEmit` | **exit 0**, no output |
| Lint | `npx eslint .` / `npm run lint` | **exit 0**, 8 warnings, 0 errors (4 `<img>` vs `next/image`, 2 `exhaustive-deps`, 1 unused `evTrack` param, 1 dep-array) |
| Production build | `npm run build` | **success**, Turbopack, 17 static routes, `.env.local` loaded |
| Rules suite | `npm run test:rules` | **pass**, `ALL RULE TESTS PASSED`; emulator log shows `evaluation error` on asserted denials |
| Exit-code propagation | `emulators:exec` running `process.exit(3)` | **exit 3 propagated** — suite can fail CI |
| Rules behaviour | throwaway probe scripts under `scripts/`, run in emulator, deleted afterwards | Probes for F1–F4 + role boundaries; results recorded inline above. `scripts/` now contains only `seed.ts` and `test-rules.mjs` |
| Runtime in browser | `npm run dev` + Playwright against `/`, `/writeups`, `/events`, `/track?slug=cloud`, `/dashboard`, `/admin` | Homepage logs `Missing or insufficient permissions.` ×2; `/dashboard` and `/admin` each return **HTTP 200** as static shells rendering "Not allowed."; `/writeups` renders "No writeups."; dev server stopped afterwards |
| Dependency audit | `npm audit`, `npm audit --omit=dev` | 29 total / 12 production (8 moderate, 4 high) |
| Secret scan | `find` for `*serviceaccount*`, `*adminsdk*`, `*.pem`, `credentials*.json`, `.env*` | Only `.env.example` (blank) and ignored `.env.local`. `.env.local` is **not** in the staged set |
| Git state | `git log`, `git branch -a`, `git remote -v`, `git diff --cached` | No commits, no branches, remote `git@github.com:redstrm-labs/gdg-tum-site.git`, 53 files staged |
| CI presence | `ls` for workflow/CI configs | none found |

### Findings that could not be verified

- **Sign-in could not be exercised.** `signInWithPopup` needs a real Google account plus an authorised origin; the emulator's auth path is not configured in this project. The `signInGoogle` race in risk item 3 is therefore a code-read inference, not an observed failure.
- **Cloudinary upload was not performed** (no credentials, and it would write to a real account). F1's "orphaned asset" half is inferred from the call ordering in [src/app/dashboard/page.tsx:305-312](file:///home/mark/Desktop/gdg-tum-site/src/app/dashboard/page.tsx#L305-L312); the "Firestore write denied" half **is** emulator-verified.
- **The hosted production site was not fetched.** No public Hosting URL exists in the repo and `.firebaserc` names only the project id, so live deployed content, deploy history, and whether Firestore currently holds any `posts` documents are unconfirmed. The homepage query fails by *rules*, so a `posts` writer would have to live outside this repo.
- **`npm run seed` was not executed** — it requires a service-account key and writes to the real project. `scripts/seed.ts` creates `tracks` via `add()` (auto-ids) while `events` reference `"cloud"`, which is what F5 is based on; the resulting live data shape was not observed.
- **Admin role semantics** (whether public `users.role` reads and public `events` reads are *intentional*) need an owner decision; both are verified as current behaviour, not as approved design.
- **Firebase Hosting caching, App Check, and billing/quota settings** are console-only and were not inspected.

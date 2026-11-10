# GDG on Campus TUM

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill Firebase values.
3. `npm run dev`

## Run against the Firestore emulator
`npm run emulator` serves the emulator project `demo-gdg-tum-site` with the local `firestore.rules` on 127.0.0.1:8080.

Set both of these in `.env.local` before `npm run dev` so browser reads and writes go to the emulator instead of the production project:

```
NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-gdg-tum-site
```

The emulator keeps a separate namespace per project id, so `src/lib/firebase.ts` refuses to start if the host is set while the project id is not a `demo-*` one. Leave both unset for production builds.

## Seed
`scripts/seed.ts` only writes to project ids listed in `ALLOWED_PROJECT_IDS`, and always refuses the production project (`gdg-tum-site`, from `.firebaserc`).

Safe local run against the emulator (no credentials needed):

```
npm run emulator                                   # terminal 1
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_PROJECT_ID=demo-gdg-tum-site npm run seed
```

To seed another non-production project with a service account, set
`GOOGLE_APPLICATION_CREDENTIALS` to its JSON path and add its `project_id` to
`ALLOWED_PROJECT_IDS` in `scripts/seed.ts`. The script exits 1 without touching
Firestore if the project id is missing, unknown, or production.

## Deploy
Build the static site and deploy Hosting plus Firestore rules:

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

Every push to `main` triggers the production deployment automatically, but only after the full CI test job passes. Pull-request runs validate changes and never deploy. The deploy job rebuilds with the production Firebase configuration and publishes Hosting plus Firestore rules and indexes.

## Decisions
- Event detail uses query param `/event?id=...` for static export.
- Ticker hides when no active doc.

## First admin bootstrap
Edit the user's role to "admin" in the Firestore console under users/{uid}.

## Cloudinary signed uploads
Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in the website build environment and configure `NEXT_PUBLIC_WRITEUP_AI_API_URL` to point to the authenticated media/AI service. On that service, configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`; keep the API secret in the hosting provider's encrypted secret store. The browser requests a signed upload after Firebase authentication. Do not create or use an unsigned upload preset for this application.

## Manual rules test checklist
- Member cannot write events.
- Lead cannot edit another track.
- Public cannot read drafts.
- User cannot promote themselves to admin.

## Known limitations
Unsigned Cloudinary preset can be abused; will be replaced by signed uploads later.

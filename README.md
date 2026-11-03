# GDG on Campus TUM

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill Firebase values.
3. `npm run dev`

## Seed
Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path, then `npm run seed`.

## Deploy
`npm run build && firebase deploy --only hosting,firestore:rules`

## Decisions
- Event detail uses query param `/event?id=...` for static export.
- Ticker hides when no active doc.

## First admin bootstrap
Edit the user's role to "admin" in the Firestore console under users/{uid}.

## Cloudinary unsigned preset
Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local. Create an unsigned upload preset in Cloudinary.

## Manual rules test checklist
- Member cannot write events.
- Lead cannot edit another track.
- Public cannot read drafts.
- User cannot promote themselves to admin.

## Deploy
npm run build && firebase deploy --only hosting,firestore:rules

## Known limitations
Unsigned Cloudinary preset can be abused; will be replaced by signed uploads later.

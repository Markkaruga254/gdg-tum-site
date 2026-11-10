# GDG TUM Writeup AI service

A small Node.js service for Gemini-assisted writeup drafts and optional photo captions. It is designed for Cloud Run or Render alongside the existing static Firebase Hosting frontend.

## Security model

- The browser sends its Firebase Authentication ID token in an HTTPS `Authorization: Bearer` header.
- The service verifies the token with Firebase Admin (including revocation checks), then loads the user's current role and track from Firestore. A lead can only generate for events in their current track and edit their own writeups; admins can manage across tracks.
- The Cloud Run service account uses Application Default Credentials for Firebase Admin. Do not ship a service-account JSON key.
- `GEMINI_API_KEY` is supplied to Cloud Run from Secret Manager. It is never placed in the frontend, GitHub source, or a `NEXT_PUBLIC_*` variable.
- Browser origins are allow-listed. Requests are size-limited and each user has separate hourly quotas for drafts and captions.
- Photo captioning requires explicit consent, accepts only media documents attached to an authorized writeup, fetches only the configured Cloudinary account's HTTPS image URLs, and does not persist suggestions. A lead reviews and applies each suggestion in the dashboard.
- Draft generation returns editable suggestions only. It does not create, save, or publish Firestore writeups.

Cloud Run must allow public HTTP invocation so a browser can reach the service directly; application access is still authenticated by Firebase ID tokens on every `/v1` route. Do not treat the service URL as a secret. If you later put an identity-aware proxy in front of it, update the browser auth flow accordingly.

## Local development

1. Create a local service environment (never commit it):
   ```sh
   cd ai-service
   npm install
   export GOOGLE_CLOUD_PROJECT=your-firebase-project-id
   export GEMINI_API_KEY=your-development-gemini-key
   export ALLOWED_ORIGINS=http://localhost:3000,https://gdg-tum-site.web.app
   export CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   npm test
   npm start
   ```
2. In the website's local `.env.local`, set:
   ```
   NEXT_PUBLIC_WRITEUP_AI_API_URL=http://localhost:8080
   ```
3. Local requests still need a valid Firebase ID token and a staff profile in the configured Firebase project. Use a dedicated non-production Firebase project for development.

## Deploy to Cloud Run

Use the GDG TUM Firebase/Google Cloud project and a region close to your users. Confirm the active project before running commands:

```sh
gcloud config get-value project
gcloud config set project YOUR_GDG_TUM_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

Create a dedicated runtime service account and grant only the roles it needs. Firebase Admin Firestore access requires `roles/datastore.user`; do not use Owner or Editor:

```sh
gcloud iam service-accounts create gdg-writeup-ai --display-name="GDG TUM Writeup AI"
gcloud projects add-iam-policy-binding YOUR_GDG_TUM_PROJECT_ID \
  --member="serviceAccount:gdg-writeup-ai@YOUR_GDG_TUM_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

Create the Gemini secret interactively so the key is not stored in shell history or source control:

```sh
gcloud secrets create gdg-tum-gemini-api-key --replication-policy=automatic
gcloud secrets versions add gdg-tum-gemini-api-key --data-file=-
```

Paste the Gemini API key into the hidden terminal input and press Ctrl+D. Grant the runtime identity access to this one secret:

```sh
gcloud secrets add-iam-policy-binding gdg-tum-gemini-api-key \
  --member="serviceAccount:gdg-writeup-ai@YOUR_GDG_TUM_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Build and deploy from the repository root:

```sh
gcloud run deploy gdg-tum-writeup-ai \
  --source ./ai-service \
  --region YOUR_CLOUD_RUN_REGION \
  --service-account gdg-writeup-ai@YOUR_GDG_TUM_PROJECT_ID.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=YOUR_GDG_TUM_PROJECT_ID,ALLOWED_ORIGINS=https://gdg-tum-site.web.app\,https://gdg-tum-site.firebaseapp.com,CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME,GEMINI_MODEL=gemini-3.8-flash" \
  --set-secrets "GEMINI_API_KEY=gdg-tum-gemini-api-key:1" \
  --memory 512Mi --cpu 1 --min 0 --max 3 --concurrency 10 --timeout 60
```

The `--allow-unauthenticated` flag enables browser reachability only; all AI endpoints still reject requests without a valid Firebase ID token and authorized GDG TUM role. The health endpoint is intentionally public and contains no project data.

After deployment, copy the Cloud Run service URL into the website's GitHub production build environment as `NEXT_PUBLIC_WRITEUP_AI_API_URL`. For local development, set it in `.env.local`. It is a public endpoint URL, not a credential. Re-run the website build and deploy after setting the value.

## API

- `GET /healthz` — liveness check.
- `POST /v1/writeups/draft` — JSON body: `{ "eventId": "...", "writeupId": "optional-existing-id", "notes": "facilitator notes" }`. Returns an editable title, <=40-word summary, Markdown body, and allow-listed topic/product tags.
- `POST /v1/media/captions` — JSON body: `{ "writeupId": "...", "mediaIds": ["..."], "consentConfirmed": true }`. Returns suggested captions and alt text for up to four selected photos. Suggestions are not saved automatically.

All `/v1` endpoints require a Firebase ID token. Requests are limited to 20 draft generations and 20 caption batches per user per hour. Image captioning has a 5 MB per-image limit.


## Deploy to Render

The service can run as a Render Node.js web service from this repository:

- Runtime: Docker
- Docker context: repository root (`.`)
- Dockerfile: `ai-service/Render.Dockerfile`
- Health check path: `/healthz`
- Region: Frankfurt is the initial choice for the Kenya-based lead team; verify actual request latency after deployment.

Set these environment variables in the Render service:

- `NODE_ENV=production`
- `GOOGLE_CLOUD_PROJECT=gdg-tum-site`
- `GEMINI_API_KEY` — secret; add it through the Render Dashboard, never Git.
- `FIREBASE_SERVICE_ACCOUNT` — secret containing the complete dedicated service-account JSON; add it through the Render Dashboard, never Git.
- `ALLOWED_ORIGINS=https://gdg-tum-site.web.app,https://gdg-tum-site.firebaseapp.com`
- `CLOUDINARY_CLOUD_NAME` — use the same cloud name as the website's `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` build variable.
- `GEMINI_MODEL=gemini-3.8-flash`

For Render, create a dedicated Google service account (for example, `gdg-writeup-ai-render`). Avoid granting `roles/datastore.user`: that predefined role allows broad Firestore data read/write access, including deletion.

Create a project-level custom role named **GDG Writeup AI Firestore Data Access** (role ID `gdgWriteupAiFirestore`) with only these permissions:

- `datastore.databases.get`
- `datastore.entities.create`
- `datastore.entities.get`
- `datastore.entities.update`

The service uses direct document reads and transaction create/update operations; it does not need Firestore collection queries or document deletion. Assign this custom role to the dedicated service account. Also assign `roles/firebaseauth.viewer` so Firebase Admin can look up user records when checking revoked ID tokens.

Firestore IAM is project-scoped here, so the custom role can still access documents by known ID across the project. The service's server-side role, track, author, event, and media ownership checks remain essential; Firebase Admin SDK requests bypass Firestore Security Rules.

Create a JSON key only after reviewing your organization's key-creation policy. Store the complete JSON only in Render's encrypted `FIREBASE_SERVICE_ACCOUNT` environment variable. Restrict who can view or change service environment variables, rotate the key periodically, and revoke it immediately if exposed. Never commit it to GitHub or paste it into chat. Do not reuse a broad project Owner/Editor service account.

The configured Gemini API key is on Google's Free tier. Submitted prompts and media may be used to improve Google products; do not send sensitive personal information or identifiable photos. Render Free services can spin down after inactivity and do not provide a production availability SLA. The dashboard's AI status component checks `/healthz`, reports measured elapsed time rather than a promised countdown, and leaves the writeup editor usable while AI starts or is unavailable. Upgrade the Render plan if the workflow later requires stronger availability.

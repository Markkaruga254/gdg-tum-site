#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="demo-gdg-tum-site"
EMULATOR_HOST="127.0.0.1:8080"

export FIRESTORE_EMULATOR_HOST="$EMULATOR_HOST"
export FIREBASE_PROJECT_ID="$PROJECT_ID"
export NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST="$EMULATOR_HOST"
export NEXT_PUBLIC_FIREBASE_API_KEY="ci-placeholder"
export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ci-placeholder.firebaseapp.com"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="$PROJECT_ID"
export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ci-placeholder.appspot.com"
export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1"
export NEXT_PUBLIC_FIREBASE_APP_ID="1:1:web:ci-placeholder"

EMULATOR_PID=""

cleanup() {
  echo "=== Cleaning up ==="
  if [ -n "$EMULATOR_PID" ]; then kill "$EMULATOR_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

echo "=== Starting Firestore emulator ==="
firebase emulators:start --only firestore --project "$PROJECT_ID" &
EMULATOR_PID=$!

# Wait for emulator to be ready
for i in $(seq 1 30); do
  if curl -s "http://$EMULATOR_HOST/emulator/v1/projects/$PROJECT_ID" > /dev/null 2>&1; then
    echo "Emulator ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Emulator did not start in time." >&2
    exit 1
  fi
  sleep 1
done

echo "=== Seeding Firestore data ==="
node scripts/e2e-seed.mjs

echo "=== Running Playwright E2E tests (Playwright webServer starts the dev server) ==="
npx playwright test

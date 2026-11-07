#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="demo-gdg-tum-site"
FIRESTORE_EMULATOR_HOST_VALUE="127.0.0.1:8080"
AUTH_EMULATOR_HOST_VALUE="127.0.0.1:9099"

export FIRESTORE_EMULATOR_HOST="$FIRESTORE_EMULATOR_HOST_VALUE"
export FIREBASE_AUTH_EMULATOR_HOST="$AUTH_EMULATOR_HOST_VALUE"
export FIREBASE_PROJECT_ID="$PROJECT_ID"
export NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST="$FIRESTORE_EMULATOR_HOST_VALUE"
export NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST="$AUTH_EMULATOR_HOST_VALUE"
export NEXT_PUBLIC_E2E_AUTH_ENABLED="true"
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

echo "=== Starting Firestore and Auth emulators ==="
firebase emulators:start --only firestore,auth --project "$PROJECT_ID" &
EMULATOR_PID=$!

# Wait for both emulators to accept connections.
for i in $(seq 1 60); do
  if (echo > /dev/tcp/127.0.0.1/8080) > /dev/null 2>&1 && \
     (echo > /dev/tcp/127.0.0.1/9099) > /dev/null 2>&1; then
    echo "Firestore and Auth emulators ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "ERROR: Firebase emulators did not start in time." >&2
    exit 1
  fi
  sleep 2
done

echo "=== Seeding Firestore and Auth test identities ==="
node scripts/e2e-seed.mjs

echo "=== Running Playwright E2E tests (Playwright webServer starts the dev server) ==="
npx playwright test

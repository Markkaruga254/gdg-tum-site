#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="demo-gdg-tum-site"
EMULATOR_HOST="127.0.0.1:8080"
DEV_PORT="3000"

export FIRESTORE_EMULATOR_HOST="$EMULATOR_HOST"
export FIREBASE_PROJECT_ID="$PROJECT_ID"
export NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST="$EMULATOR_HOST"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="$PROJECT_ID"

EMULATOR_PID=""
DEV_PID=""

cleanup() {
  echo "=== Cleaning up ==="
  if [ -n "$DEV_PID" ]; then kill "$DEV_PID" 2>/dev/null || true; fi
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

echo "=== Starting Next.js dev server ==="
npm run dev &
DEV_PID=$!

# Wait for dev server
for i in $(seq 1 60); do
  if curl -s "http://localhost:$DEV_PORT" > /dev/null 2>&1; then
    echo "Dev server ready."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "ERROR: Dev server did not start in time." >&2
    exit 1
  fi
  sleep 2
done

echo "=== Running Playwright E2E tests ==="
npx playwright test

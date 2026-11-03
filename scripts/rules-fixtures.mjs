// Shared harness for the Firestore security-rules suite.
import { readFileSync } from "node:fs";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

// demo-* ids are served only by the emulator, so a misrouted run fails closed
// instead of touching the real project.
export const TEST_PROJECT = "demo-gdg-tum-site";

export function requireEmulator() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error("FIRESTORE_EMULATOR_HOST is unset. Run via `npm run test:rules`.");
    process.exit(1);
  }
  if (!TEST_PROJECT.startsWith("demo-")) {
    console.error("TEST_PROJECT must remain an emulator-only demo-* project id.");
    process.exit(1);
  }
}

export async function loadTestEnv() {
  return initializeTestEnvironment({
    projectId: TEST_PROJECT,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
}

export async function seedFixtures(env) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const users = {
      "u-admin": { name: "Fixture Admin", role: "admin", track: null },
      "u-lead-cloud": { name: "Fixture Lead Cloud", role: "lead", track: "cloud" },
      "u-lead-web": { name: "Fixture Lead Web", role: "lead", track: "web" },
      "u-member": { name: "Fixture Member", role: "member", track: null },
      "u-other-member": { name: "Fixture Other Member", role: "member", track: null },
      "u-disposable": { name: "Fixture Delete Target", role: "member", track: null },
    };
    for (const [id, data] of Object.entries(users)) {
      await setDoc(doc(db, "users", id), data);
      await setDoc(doc(db, "private_users", id), { email: `${id}@example.invalid` });
    }

    const tracks = {
      cloud: { name: "Cloud", slug: "cloud", color: "blue", description: "Fixture", leadIds: ["u-lead-cloud"] },
      web: { name: "Web", slug: "web", color: "green", description: "Fixture", leadIds: ["u-lead-web"] },
    };
    for (const [id, data] of Object.entries(tracks)) await setDoc(doc(db, "tracks", id), data);

    await setDoc(doc(db, "events", "ev-cloud"), { title: "Fixture Cloud Event", trackId: "cloud", status: "upcoming", venue: "Fixture" });
    await setDoc(doc(db, "events", "ev-web"), { title: "Fixture Web Event", trackId: "web", status: "past", venue: "Fixture" });
    await setDoc(doc(db, "events", "ev-transfer"), { title: "Fixture Transfer Event", trackId: "cloud", status: "upcoming", venue: "Fixture" });

    await setDoc(doc(db, "writeups", "w-published-cloud"), { title: "Fixture Published", eventId: "ev-cloud", trackId: "cloud", authorId: "u-lead-cloud", body: "Fixture", status: "published", publishedAt: new Date(), tags: { topics: [], products: [] } });
    await setDoc(doc(db, "writeups", "w-draft-cloud"), { title: "Fixture Draft", eventId: "ev-cloud", trackId: "cloud", authorId: "u-lead-cloud", body: "Fixture", status: "draft", tags: { topics: [], products: [] } });
    await setDoc(doc(db, "writeups", "w-flip-cloud"), { title: "Fixture Flip Draft", eventId: "ev-cloud", trackId: "cloud", authorId: "u-lead-cloud", body: "Fixture", status: "draft", tags: { topics: [], products: [] } });
    await setDoc(doc(db, "writeups", "w-draft-web"), { title: "Fixture Web Draft", eventId: "ev-web", trackId: "web", authorId: "u-lead-web", body: "Fixture", status: "draft", tags: { topics: [], products: [] } });

    await setDoc(doc(db, "media", "m-published"), { writeupId: "w-published-cloud", url: "https://example.invalid/a.jpg", publicId: "fixture/a", caption: "", altText: "", createdBy: "u-lead-cloud" });
    await setDoc(doc(db, "media", "m-draft"), { writeupId: "w-draft-cloud", url: "https://example.invalid/b.jpg", publicId: "fixture/b", caption: "", altText: "", createdBy: "u-lead-cloud" });

    await setDoc(doc(db, "ticker", "tk-cloud"), { eventId: "ev-cloud", message: "Fixture ticker", status: "active", createdBy: "u-lead-cloud" });
    await setDoc(doc(db, "ticker", "tk-web"), { eventId: "ev-web", message: "Fixture web ticker", status: "inactive", createdBy: "u-lead-web" });
  });
}

const identities = {
  admin: "u-admin",
  leadCloud: "u-lead-cloud",
  leadWeb: "u-lead-web",
  member: "u-member",
  otherMember: "u-other-member",
};

export function actors(env) {
  const db = {};
  for (const [name, uid] of Object.entries(identities)) db[name] = env.authenticatedContext(uid, { sub: uid }).firestore();
  db.anon = env.unauthenticatedContext().firestore();
  return db;
}

// A fresh actor with no users document, for first-sign-in create tests.
export function freshActor(env, uid) {
  return env.authenticatedContext(uid, { sub: uid }).firestore();
}

const results = [];
const crashDenials = [];
export function section(title) {
  results.push({ heading: title });
}

function describeError(e) {
  const code = e?.code ?? typeof e;
  const message = (e?.message ?? String(e)).replace(/\s+/g, " ").trim();
  return `${code} :: ${message}`;
}

// Genuine rule crashes are identifiable by these markers. The bare
// "evaluation error at Lx:cy" string is not one: this emulator build also emits it
// for correct denials whose condition calls get(), so it cannot decide a case.
// What a real crash does is fail to evaluate an expression, reported as a null
// value or a missing property, and that is the signal worth pinning.
const CRASH = /Null value error|undefined on object/i;

function crashReason(message) {
  const match = String(message).match(CRASH);
  return match ? match[0] : "";
}

export async function expectAllowed(thunk, label) {
  try {
    await thunk();
    results.push({ label, ok: true });
  } catch (e) {
    results.push({ label, ok: false, detail: `expected success, got ${describeError(e)}` });
  }
}

export async function expectDenied(thunk, label, opts = {}) {
  try {
    await thunk();
    results.push({ label, ok: false, detail: "expected PERMISSION_DENIED, operation succeeded" });
  } catch (e) {
    const message = e?.message ?? "";
    if (e?.code !== "permission-denied") {
      results.push({ label, ok: false, detail: `expected PERMISSION_DENIED, got ${describeError(e)}` });
    } else if (opts.clean && CRASH.test(message)) {
      results.push({ label, ok: false, detail: `denied by a rule crash, not a predicate: ${crashReason(message)}` });
    } else {
      results.push({ label, ok: true });
      if (CRASH.test(message)) crashDenials.push(`${label} — ${crashReason(message)}`);
    }
  }
}

// Pins a denial that only happens because the expression errors (F1-F3 class).
// When the rule is fixed the marker disappears and this case fails, forcing the
// author to convert it into a real predicate assertion.
export async function expectDeniedForCrash(thunk, label, marker, finding) {
  try {
    await thunk();
    results.push({ label, ok: false, detail: `expected a denial via "${marker}" (${finding}), operation succeeded` });
  } catch (e) {
    const message = e?.message ?? "";
    if (e?.code !== "permission-denied") {
      results.push({ label, ok: false, detail: `expected PERMISSION_DENIED (${finding}), got ${describeError(e)}` });
    } else if (message.includes(marker)) {
      results.push({ label, ok: true, detail: `${finding} reproduced` });
      crashDenials.push(`${label} — ${finding}`);
    } else {
      results.push({ label, ok: false, detail: `${finding}: denial no longer relies on "${marker}" — convert this to expectDenied` });
    }
  }
}

export function report() {
  let failed = 0;
  let passed = 0;
  for (const entry of results) {
    if (entry.heading) {
      console.log(`\n${entry.heading}`);
      continue;
    }
    if (entry.ok) {
      passed++;
      console.log(`  ok    ${entry.label}${entry.detail ? ` (${entry.detail})` : ""}`);
    } else {
      failed++;
      console.log(`  FAIL  ${entry.label}\n          ${entry.detail}`);
    }
  }
  if (crashDenials.length > 0) {
    console.log(`\nDenials that depend on a rule crash (${crashDenials.length}) — intended behaviour, see the fix commits:`);
    for (const line of crashDenials) console.log(`  ~     ${line}`);
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("RULES SUITE FAILED");
    process.exit(1);
  }
  console.log("ALL RULE TESTS PASSED");
}

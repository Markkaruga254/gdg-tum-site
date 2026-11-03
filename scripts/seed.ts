import admin from "firebase-admin";
import { readFileSync } from "fs";

// .firebaserc projects.default: the project the live site reads. Never seed it.
const PRODUCTION_PROJECT_ID = "gdg-tum-site";
// Every project this script may write to. Extend deliberately, per environment.
const ALLOWED_PROJECT_IDS = ["demo-gdg-tum-site"];

function refuse(message: string): never {
  console.error(`seed aborted: ${message}`);
  process.exit(1);
}

function resolveProjectId(): string {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const projectId = JSON.parse(readFileSync(credPath, "utf8")).project_id;
    if (!projectId) refuse(`${credPath} has no project_id`);
    return projectId;
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return process.env.FIREBASE_PROJECT_ID || refuse("set FIREBASE_PROJECT_ID to the emulator project");
  }
  return refuse("set GOOGLE_APPLICATION_CREDENTIALS, or FIRESTORE_EMULATOR_HOST with FIREBASE_PROJECT_ID for a local emulator");
}

const projectId = resolveProjectId();
if (projectId === PRODUCTION_PROJECT_ID) refuse(`"${projectId}" is the production project`);
if (!ALLOWED_PROJECT_IDS.includes(projectId)) {
  refuse(`"${projectId}" is not in ALLOWED_PROJECT_IDS (${ALLOWED_PROJECT_IDS.join(", ")}); add it in scripts/seed.ts only if it is not production`);
}

admin.initializeApp({
  projectId,
  ...(process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? { credential: admin.credential.cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS!, "utf8"))) }
    : {}),
});
const db = admin.firestore();
console.log(`Seeding ${projectId} (${process.env.FIRESTORE_EMULATOR_HOST ? "emulator" : "live"})`);

async function main() {
  const leadCloud = await db.collection("users").add({ name: "[Lead name]", role: "lead", track: "cloud", bio: "[Bio]", photoUrl: "" });
  const leadCyber = await db.collection("users").add({ name: "[Lead name 2]", role: "lead", track: "cybersecurity", bio: "[Bio]", photoUrl: "" });

  const tracks = [
    { name: "Cloud", slug: "cloud", color: "blue", description: "[Description]", leadIds: [leadCloud.id] },
    { name: "Cybersecurity", slug: "cybersecurity", color: "red", description: "[Description]", leadIds: [leadCyber.id] },
    { name: "Web", slug: "web", color: "green", description: "[Description]", leadIds: [] },
    { name: "Women in Tech", slug: "women-in-tech", color: "yellow", description: "[Description]", leadIds: [] },
  ];
  for (const t of tracks) await db.collection("tracks").doc(t.slug).set(t);

  const now = admin.firestore.Timestamp.now();
  const ev1 = await db.collection("events").add({ title: "[Event name]", trackId: "cloud", date: now, venue: "[Venue]", status: "upcoming", rsvpCount: 0 });
  const ev2 = await db.collection("events").add({ title: "[Event name 2]", trackId: "web", date: now, venue: "[Venue]", status: "past", attendance: 0 });
  await db.collection("events").add({ title: "[Event name 3]", trackId: "cybersecurity", date: now, venue: "[Venue]", status: "past", attendance: 0 });

  await db.collection("writeups").add({
    eventId: ev2.id, trackId: "web", authorId: leadCloud.id, title: "[Writeup title]",
    summary: "[Summary]", body: "[Body]", tags: { topics: [], products: [] },
    status: "published", aiDrafted: true, publishedAt: now,
  });
  await db.collection("writeups").add({
    eventId: ev1.id, trackId: "cloud", authorId: leadCyber.id, title: "[Writeup title 2]",
    summary: "[Summary]", body: "[Body]", tags: { topics: [], products: [] },
    status: "published", aiDrafted: false, publishedAt: now,
  });

  console.log("Seeded");
}
main().catch((e) => { console.error(e); process.exit(1); });

import crypto from "node:crypto";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "demo-gdg-tum-site";

const { privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: PROJECT_ID,
      clientEmail: "e2e-seed@test.invalid",
      privateKey,
    }),
    projectId: PROJECT_ID,
  });
}

const db = getFirestore();

const tracks = [
  { id: "track-cloud", slug: "cloud", name: "Cloud", color: "blue", description: "Cloud computing and serverless track", leadIds: ["u-lead-cloud"] },
  { id: "track-cybersecurity", slug: "cybersecurity", name: "Cybersecurity", color: "red", description: "Application and network security track", leadIds: ["u-lead-cyber"] },
  { id: "track-web", slug: "web", name: "Web", color: "green", description: "Frontend and full-stack web track", leadIds: ["u-lead-web"] },
  { id: "track-wit", slug: "women-in-tech", name: "Women in Tech", color: "yellow", description: "Community and mentorship track", leadIds: ["u-lead-wit"] },
];

const testAccounts = [
  { id: "e2e-admin", email: "admin@e2e.test", name: "E2E Admin", role: "admin", track: null },
  { id: "u-lead-cloud", email: "lead@e2e.test", name: "Cloud Lead", role: "lead", track: "cloud" },
];

const users = [
  { id: "u-lead-cloud", name: "Cloud Lead", role: "lead", track: "cloud", photoUrl: "", bio: "", links: [] },
  { id: "u-lead-cyber", name: "Cyber Lead", role: "lead", track: "cybersecurity", photoUrl: "", bio: "", links: [] },
  { id: "u-lead-web", name: "Web Lead", role: "lead", track: "web", photoUrl: "", bio: "", links: [] },
  { id: "u-lead-wit", name: "WIT Lead", role: "lead", track: "women-in-tech", photoUrl: "", bio: "", links: [] },
  { id: "u-member", name: "Member User", role: "member", track: "cloud", photoUrl: "", bio: "", links: [] },
  ...testAccounts.filter(({ role }) => role === "admin").map(({ id, name, role, track }) => ({ id, name, role, track, photoUrl: "", bio: "", links: [] })),
];

const events = [
  { id: "ev-cloud-upcoming", title: "Cloud Build Day", trackId: "cloud", date: new Date("2026-12-01T10:00:00Z"), venue: "Hall A", status: "upcoming", attendance: 50, rsvpCount: 30, writeupId: null },
  { id: "ev-cloud-past", title: "Cloud 101 Workshop", trackId: "cloud", date: new Date("2026-10-15T14:00:00Z"), venue: "Hall B", status: "past", attendance: 40, rsvpCount: 40, writeupId: "w-published-cloud" },
  { id: "ev-web-upcoming", title: "Web Workshop", trackId: "web", date: new Date("2026-12-10T16:00:00Z"), venue: "Lab 2", status: "upcoming", attendance: null, rsvpCount: null, writeupId: null },
];

const writeups = [
  { id: "w-published-cloud", eventId: "ev-cloud-past", trackId: "cloud", authorId: "u-lead-cloud", title: "Cloud 101 Recap", summary: "A recap of our cloud workshop", body: "# Cloud 101\n\nWe learned about serverless.", attendance: 40, links: [], tags: { topics: ["cloud"], products: [] }, status: "published", publishedAt: new Date("2026-10-16T10:00:00Z"), aiDrafted: false },
  { id: "w-draft-cloud", eventId: "ev-cloud-upcoming", trackId: "cloud", authorId: "u-lead-cloud", title: "Cloud Build Day Draft", summary: "Draft of upcoming event", body: "Draft content", attendance: "", links: [], tags: { topics: ["cloud"], products: [] }, status: "draft", publishedAt: null, aiDrafted: false },
  { id: "w-published-web", eventId: "ev-web-upcoming", trackId: "web", authorId: "u-lead-web", title: "Web Intro", summary: "Web development intro", body: "# Web Intro\n\nIntro to web dev.", attendance: "", links: [], tags: { topics: ["web"], products: [] }, status: "published", publishedAt: new Date("2026-11-01T10:00:00Z"), aiDrafted: false },
];

function placeholderPhoto(background, foreground = "#fff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${background}"/><text x="300" y="215" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="${foreground}">PHOTO</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const media = [
  { id: "m-cloud-1", writeupId: "w-published-cloud", url: placeholderPhoto("#1967D2"), publicId: "e2e/cloud-photo-1", caption: "Cloud workshop photo", altText: "Blue placeholder for a cloud workshop photo", createdBy: "u-lead-cloud" },
  { id: "m-cloud-2", writeupId: "w-published-cloud", url: placeholderPhoto("#EA4335", "#111"), publicId: "e2e/cloud-photo-2", caption: "Workshop group photo", altText: "Red placeholder for a workshop group photo", createdBy: "u-lead-cloud" },
  { id: "m-cloud-3", writeupId: "w-published-cloud", url: placeholderPhoto("#34A853", "#111"), publicId: "e2e/cloud-photo-3", caption: "Cloud lab session", altText: "Green placeholder for a cloud lab session", createdBy: "u-lead-cloud" },
  { id: "m-web-1", writeupId: "w-published-web", url: placeholderPhoto("#FBBC04", "#111"), publicId: "e2e/web-photo-1", caption: "Web workshop", altText: "Yellow placeholder for a web workshop", createdBy: "u-lead-web" },
  { id: "m-web-2", writeupId: "w-published-web", url: placeholderPhoto("#1967D2"), publicId: "e2e/web-photo-2", caption: "Web development session", altText: "Blue placeholder for a web development session", createdBy: "u-lead-web" },
  { id: "m-web-3", writeupId: "w-published-web", url: placeholderPhoto("#EA4335", "#111"), publicId: "e2e/web-photo-3", caption: "Web community", altText: "Red placeholder for a web community photo", createdBy: "u-lead-web" },
];

const partners = [
  { id: "p-university", name: "Technical University of Mombasa", logoUrl: "", link: "https://tum.ac.ke", type: "university", order: 1, active: true },
  { id: "p-sponsor", name: "Tech Sponsor", logoUrl: "", link: "https://example.invalid", type: "sponsor", order: 2, active: true },
];

async function main() {
  for (const account of testAccounts) {
    await admin.auth().createUser({
      uid: account.id,
      email: account.email,
      password: "e2e-password",
      displayName: account.name,
    });
  }

  const batch = db.batch();

  for (const t of tracks) batch.set(db.collection("tracks").doc(t.id), t);
  for (const u of users) {
    batch.set(db.collection("users").doc(u.id), u);
    batch.set(db.collection("private_users").doc(u.id), { email: `${u.id}@example.invalid` });
  }
  for (const e of events) batch.set(db.collection("events").doc(e.id), e);
  for (const w of writeups) batch.set(db.collection("writeups").doc(w.id), w);
  for (const m of media) batch.set(db.collection("media").doc(m.id), m);
  for (const p of partners) batch.set(db.collection("partners").doc(p.id), p);

  await batch.commit();
  console.log("Seeded Auth identities plus tracks, users, events, writeups, media, partners.");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

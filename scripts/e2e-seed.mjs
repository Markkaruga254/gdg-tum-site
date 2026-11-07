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
  { id: "ev-cloud-past-2", title: "Serverless Lab", trackId: "cloud", date: new Date("2026-09-15T14:00:00Z"), venue: "Lab 1", status: "past", attendance: 32, rsvpCount: 32, writeupId: "w-published-cloud-2" },
  { id: "ev-cloud-past-3", title: "Cloud Storage Workshop", trackId: "cloud", date: new Date("2026-08-15T14:00:00Z"), venue: "Hall A", status: "past", attendance: 28, rsvpCount: 28, writeupId: "w-published-cloud-3" },
  { id: "ev-web-upcoming", title: "Web Workshop", trackId: "web", date: new Date("2026-12-10T16:00:00Z"), venue: "Lab 2", status: "upcoming", attendance: null, rsvpCount: null, writeupId: null },
  { id: "ev-cyber-upcoming", title: "Cybersecurity Lab", trackId: "cybersecurity", date: new Date("2026-12-15T10:00:00Z"), venue: "Lab 3", status: "upcoming", attendance: null, rsvpCount: null, writeupId: null },
];

const writeups = [
  { id: "w-published-cloud", eventId: "ev-cloud-past", trackId: "cloud", authorId: "u-lead-cloud", title: "Cloud 101 Recap", summary: "A recap of our cloud workshop", body: "# Cloud 101\n\nWe learned about serverless.", attendance: 40, links: [], tags: { topics: ["cloud"], products: [] }, status: "published", publishedAt: new Date("2026-11-07T10:00:00Z"), aiDrafted: false },
  { id: "w-draft-cloud", eventId: "ev-cloud-past", trackId: "cloud", authorId: "u-lead-cloud", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }], tags: { topics: [], products: [] }, status: "draft", publishedAt: null, aiDrafted: false },
  { id: "w-draft-preview-cloud", eventId: "ev-cloud-past", trackId: "cloud", authorId: "u-lead-cloud", title: "Cloud workshop recap", summary: "A short summary of the cloud workshop and what participants learned.", body: "We compared compute, storage and networking options during a hands-on session.\\n\\n## Key Takeaways\\n- Choose services based on workload needs.\\n- Secure identities and permissions from the start.\\n- Monitor cost and performance as you grow.", attendance: 40, links: [{ title: "Cloud workshop slides", url: "https://example.com/e2e-cloud-slides" }], tags: { topics: ["cloud", "devops"], products: ["google-cloud"] }, status: "draft", publishedAt: null, aiDrafted: false },
  { id: "w-published-web", eventId: "ev-web-upcoming", trackId: "web", authorId: "u-lead-web", title: "Web Intro", summary: "Web development intro", body: "# Web Intro\n\nIntro to web dev.", attendance: "", links: [], tags: { topics: ["web"], products: [] }, status: "published", publishedAt: new Date("2026-11-06T10:00:00Z"), aiDrafted: false },
  { id: "w-published-cloud-2", eventId: "ev-cloud-past-2", trackId: "cloud", authorId: "u-lead-cloud", title: "Serverless Functions in Practice", summary: "A hands-on introduction to serverless workflows.", body: "# Serverless Functions\n\nWe built and tested a small serverless workflow.", attendance: 32, links: [], tags: { topics: ["cloud"], products: ["Firebase"] }, status: "published", publishedAt: new Date("2026-11-05T10:00:00Z"), aiDrafted: false },
  { id: "w-published-cloud-3", eventId: "ev-cloud-past-3", trackId: "cloud", authorId: "u-lead-cloud", title: "Getting Started with Cloud Storage", summary: "A practical session on storing and serving files.", body: "# Cloud Storage\n\nWe explored object storage and access controls.", attendance: 28, links: [], tags: { topics: ["cloud"], products: ["Google Cloud"] }, status: "published", publishedAt: new Date("2026-11-04T10:00:00Z"), aiDrafted: false },
];

function placeholderPhoto(background, foreground = "#fff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${background}"/><text x="300" y="215" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="${foreground}">PHOTO</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const media = [
  { id: "m-cloud-1", writeupId: "w-published-cloud", url: placeholderPhoto("#1967D2"), publicId: "e2e/cloud-photo-1", caption: "Cloud workshop photo", altText: "Blue placeholder for a cloud workshop photo", createdBy: "u-lead-cloud" },
  { id: "m-cloud-2", writeupId: "w-published-cloud", url: placeholderPhoto("#EA4335", "#111"), publicId: "e2e/cloud-photo-2", caption: "Workshop group photo", altText: "Red placeholder for a workshop group photo", createdBy: "u-lead-cloud" },
  { id: "m-cloud-3", writeupId: "w-published-cloud", url: placeholderPhoto("#34A853", "#111"), publicId: "e2e/cloud-photo-3", caption: "Cloud lab session", altText: "Green placeholder for a cloud lab session", createdBy: "u-lead-cloud" },
  { id: "m-draft-1", writeupId: "w-draft-cloud", url: placeholderPhoto("#1967D2"), publicId: "e2e/draft-photo-1", caption: "Cloud workshop photo", altText: "Blue placeholder for a cloud workshop photo", createdBy: "u-lead-cloud" },
  { id: "m-draft-2", writeupId: "w-draft-cloud", url: placeholderPhoto("#EA4335", "#111"), publicId: "e2e/draft-photo-2", caption: "Workshop group photo", altText: "Red placeholder for a workshop group photo", createdBy: "u-lead-cloud" },
  { id: "m-draft-3", writeupId: "w-draft-cloud", url: placeholderPhoto("#34A853", "#111"), publicId: "e2e/draft-photo-3", caption: "Cloud lab session", altText: "Green placeholder for a cloud lab session", createdBy: "u-lead-cloud" },
  { id: "m-web-1", writeupId: "w-published-web", url: placeholderPhoto("#FBBC04", "#111"), publicId: "e2e/web-photo-1", caption: "Web workshop", altText: "Yellow placeholder for a web workshop", createdBy: "u-lead-web" },
  { id: "m-web-2", writeupId: "w-published-web", url: placeholderPhoto("#1967D2"), publicId: "e2e/web-photo-2", caption: "Web development session", altText: "Blue placeholder for a web development session", createdBy: "u-lead-web" },
  { id: "m-web-3", writeupId: "w-published-web", url: placeholderPhoto("#EA4335", "#111"), publicId: "e2e/web-photo-3", caption: "Web community", altText: "Red placeholder for a web community photo", createdBy: "u-lead-web" },
];

const partners = [
  { id: "p-university", name: "Technical University of Mombasa", logoUrl: "", link: "https://tum.ac.ke", type: "university", order: 1, active: true },
  { id: "p-community", name: "Community Partner", logoUrl: "", link: "https://example.com/community", type: "community", order: 2, active: true },
  { id: "p-sponsor", name: "Tech Sponsor", logoUrl: "", link: "https://example.com/sponsor", type: "sponsor", order: 3, active: true },
  { id: "p-company", name: "Company Partner", logoUrl: "", link: "https://example.com/company", type: "company", order: 4, active: true },
];

const posts = [
  { id: "post-cloud", title: "Building with cloud-native tools", summary: "A practical look at deploying reliable applications with modern cloud services.", sourceName: "Sample source", sourceUrl: "https://example.com/e2e-cloud", tags: ["cloud", "devops"], fetchedAt: new Date("2026-11-07T08:00:00Z"), hidden: false },
  { id: "post-web", title: "What is new in web development", summary: "A short roundup of useful frontend and full-stack engineering ideas.", sourceName: "Sample source", sourceUrl: "https://example.com/e2e-web", tags: ["web", "javascript"], fetchedAt: new Date("2026-11-06T08:00:00Z"), hidden: false },
  { id: "post-ai", title: "Practical AI for developers", summary: "Ideas for building useful AI-powered tools with clear evaluation and safeguards.", sourceName: "Sample source", sourceUrl: "https://example.com/e2e-ai", tags: ["AI", "machine-learning"], fetchedAt: new Date("2026-11-05T08:00:00Z"), hidden: false },
  { id: "post-security", title: "Security basics for every builder", summary: "A checklist for protecting applications, accounts and user data.", sourceName: "Sample source", sourceUrl: "https://example.com/e2e-security", tags: ["cybersecurity", "security"], fetchedAt: new Date("2026-11-04T08:00:00Z"), hidden: false },
  { id: "post-data", title: "Working with data responsibly", summary: "How to turn raw information into useful and trustworthy insights.", sourceName: "Sample source", sourceUrl: "https://example.com/e2e-data", tags: ["data", "AI"], fetchedAt: new Date("2026-11-03T08:00:00Z"), hidden: false },
  { id: "post-open-source", title: "Getting started with open source", summary: "Small ways to contribute, learn in public and collaborate with others.", sourceName: "Sample source", sourceUrl: "https://example.com/e2e-open-source", tags: ["community", "open-source"], fetchedAt: new Date("2026-11-02T08:00:00Z"), hidden: false },
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
  for (const post of posts) batch.set(db.collection("posts").doc(post.id), post);

  await batch.commit();
  console.log("Seeded Auth identities plus tracks, users, events, writeups, media, partners and blog posts.");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

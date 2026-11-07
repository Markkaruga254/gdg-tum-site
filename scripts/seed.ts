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
  const leadDefs = [
    { name: "Mitchelle Ndunge", role: "lead", track: "cloud", bio: "Chapter lead", photoUrl: "" },
    { name: "Rooney Odhiambo", role: "lead", track: "cloud", bio: "VC chair", photoUrl: "" },
    { name: "Mark Karuga", role: "lead", track: "cloud", bio: "Cloud track lead", photoUrl: "" },
    { name: "Lewis Kagiri", role: "lead", track: "cloud", bio: "AI/ML lead", photoUrl: "" },
    { name: "Ian Chacha", role: "lead", track: "cloud", bio: "Mobile track lead", photoUrl: "" },
    { name: "Kimberly Gift", role: "lead", track: "cybersecurity", bio: "Cybersecurity track lead", photoUrl: "" },
    { name: "Larah Flynn", role: "lead", track: "women-in-tech", bio: "Women in Tech lead", photoUrl: "" },
    { name: "Edith Karanja", role: "lead", track: "cloud", bio: "Hackathons and solutions", photoUrl: "" },
    { name: "Sam Ryan", role: "lead", track: "web", bio: "Web development lead", photoUrl: "" },
  ];
  const leadRefs = await Promise.all(leadDefs.map((lead) => db.collection("users").add(lead)));
  const leadIdsByTrack: Record<string, string[]> = { cloud: [], cybersecurity: [], web: [], "women-in-tech": [] };
  leadDefs.forEach((lead, i) => { leadIdsByTrack[lead.track].push(leadRefs[i].id); });
  const leadCloud = leadRefs[2];
  const leadCyber = leadRefs[5];

  const tracks = [
    { name: "Cloud", slug: "cloud", color: "blue", description: "Explore cloud platforms, infrastructure and deployment.", leadIds: leadIdsByTrack.cloud },
    { name: "Cybersecurity", slug: "cybersecurity", color: "red", description: "Learn to identify risks and build more secure systems.", leadIds: leadIdsByTrack.cybersecurity },
    { name: "Web", slug: "web", color: "green", description: "Design, build and ship useful web experiences.", leadIds: leadIdsByTrack.web },
    { name: "Women in Tech", slug: "women-in-tech", color: "yellow", description: "Create space for women to learn, collaborate and lead in technology.", leadIds: leadIdsByTrack["women-in-tech"] },
  ];
  for (const t of tracks) await db.collection("tracks").doc(t.slug).set(t);

  const now = admin.firestore.Timestamp.now();
  const ev1 = await db.collection("events").add({ title: "Cloud fundamentals workshop", trackId: "cloud", date: now, venue: "Main Lab", status: "past", attendance: 24 });
  const ev2 = await db.collection("events").add({ title: "Cybersecurity essentials", trackId: "cybersecurity", date: now, venue: "Engineering Lab", status: "past", attendance: 18 });
  await db.collection("events").add({ title: "Web build session", trackId: "web", date: now, venue: "Main Lab", status: "upcoming", rsvpCount: 0 });

  await db.collection("writeups").add({
    eventId: ev2.id, trackId: "cybersecurity", authorId: leadCyber.id, title: "Securing a first web application",
    summary: "A practical introduction to common web risks and the controls that reduce them.",
    body: "The session covered input validation, authentication boundaries and safe handling of user data. Students worked through examples and discussed how to test their own applications responsibly.",
    tags: { topics: ["Application Security"], products: [] },
    status: "published", aiDrafted: true, publishedAt: now,
  });
  await db.collection("writeups").add({
    eventId: ev1.id, trackId: "cloud", authorId: leadCloud.id, title: "Cloud fundamentals: choosing the right service",
    summary: "An introduction to core cloud service models and how to choose an appropriate starting point.",
    body: "Students compared compute, storage and managed platform services. The discussion focused on matching the service to the workload, understanding operational trade-offs and keeping deployments observable.",
    tags: { topics: ["Cloud"], products: ["Google Cloud"] },
    status: "published", aiDrafted: false, publishedAt: now,
  });

  console.log("Seeded");
}
main().catch((e) => { console.error(e); process.exit(1); });

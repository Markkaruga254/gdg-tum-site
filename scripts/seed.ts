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
  // Club-wide leadership positions are not assigned to one of the four
  // published tracks. Only the four actual track leads populate track.leadIds.
  const leadDefs = [
    {
      id: "u-lead-mitchelle",
      name: "Mitchelle Ndunge",
      role: "lead",
      track: null,
      leadershipTitle: "Chapter Lead",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/Dahliastar" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/michelle-ndunge-7815482a2/" }],
    },
    {
      id: "u-lead-rooney",
      name: "Rooney Odhiambo",
      role: "lead",
      track: null,
      leadershipTitle: "VC Chair",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/KabuorJnr" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/rooney-odhiambo-9a26b6256/" }],
    },
    {
      id: "u-lead-mark",
      name: "Mark Karuga",
      role: "lead",
      track: "cloud",
      leadershipTitle: "Cloud Track Lead",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/Markkaruga254" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/mark-karuga" }],
    },
    {
      id: "u-lead-lewis",
      name: "Lewis Kagiri",
      role: "lead",
      track: null,
      leadershipTitle: "AI/ML Track Lead",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/10kwise" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/lewis-ndegwa-683718294/" }],
    },
    {
      id: "u-lead-ian",
      name: "Ian Chacha",
      role: "lead",
      track: null,
      leadershipTitle: "Mobile Track Lead",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/ianchacha" }],
    },
    {
      id: "u-lead-kimberly",
      name: "Kimberly Gift",
      role: "lead",
      track: "cybersecurity",
      leadershipTitle: "Cybersecurity Track Lead",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/kimmy-sec" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/gift-kimberly-bb784b419/" }],
    },
    {
      id: "u-lead-larah",
      name: "Larah Flynn",
      role: "lead",
      track: "women-in-tech",
      leadershipTitle: "Women in Tech Lead",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/larah-del" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/larah-flynn-164b993a6/" }],
    },
    {
      id: "u-lead-edith",
      name: "Edith Karanja",
      role: "lead",
      track: null,
      leadershipTitle: "Hackathons & Solutions",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/edithcalm" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/edith-karanja/" }],
    },
    {
      id: "u-lead-sam",
      name: "Sam Ryan",
      role: "lead",
      track: "web",
      leadershipTitle: "Web Development Track",
      bio: "",
      photoUrl: "",
      links: [{ title: "GitHub", url: "https://github.com/Ryanking254" }, { title: "LinkedIn", url: "https://www.linkedin.com/in/samryan-adeny-6995a8436/" }],
    },
  ];

  // Stable document IDs make repeated demo seeds update the same public profiles
  // instead of appending duplicate lead records.
  const seededLeads = await Promise.all(leadDefs.map(async ({ id, ...profile }) => {
    const existing = await db.collection("users").where("name", "==", profile.name).get();
    if (existing.size > 1) {
      refuse(`multiple user records found for "${profile.name}"; resolve duplicates before seeding`);
    }
    const ref = existing.empty ? db.collection("users").doc(id) : existing.docs[0].ref;
    await ref.set(profile, { merge: true });
    return { ...profile, id: ref.id };
  }));

  const leadIdsByTrack: Record<string, string[]> = {
    cloud: [],
    cybersecurity: [],
    web: [],
    "women-in-tech": [],
  };
  seededLeads.forEach((lead) => {
    if (lead.track) leadIdsByTrack[lead.track].push(lead.id);
  });
  const leadCloud = seededLeads.find((lead) => lead.name === "Mark Karuga")!;
  const leadCyber = seededLeads.find((lead) => lead.name === "Kimberly Gift")!;

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

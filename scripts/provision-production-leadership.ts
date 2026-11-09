import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const PROJECT_ID = "gdg-tum-site";
const ADMIN_UID = "KoYwxs8piKh4c4tkcIHzOURzCwC3";
const APPLY_CONFIRMATION = "gdg-tum-site";
const apply = process.argv.includes("--apply");

function fail(message: string): never {
  console.error(`Provisioning aborted: ${message}`);
  process.exit(1);
}

const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialPath) fail("Set GOOGLE_APPLICATION_CREDENTIALS to a dedicated Firebase Admin service-account JSON file.");

const serviceAccount = JSON.parse(readFileSync(credentialPath, "utf8")) as {
  project_id?: string;
};
if (serviceAccount.project_id !== PROJECT_ID) {
  fail(`Credential project_id must be ${PROJECT_ID}; received ${serviceAccount.project_id ?? "missing"}.`);
}
if (apply && process.env.CONFIRM_PRODUCTION_PROVISIONING !== APPLY_CONFIRMATION) {
  fail(`For writes, set CONFIRM_PRODUCTION_PROVISIONING=${APPLY_CONFIRMATION} and pass --apply.`);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  projectId: PROJECT_ID,
});
const db = admin.firestore();

type TrackSlug =
  | "cloud"
  | "cybersecurity"
  | "web"
  | "women-in-tech"
  | "ai-ml"
  | "mobile"
  | "hackathons-solutions";

type LeadDefinition = {
  id: string;
  name: string;
  track: TrackSlug | null;
  leadershipTitle: string;
  links?: { title: string; url: string }[];
};

const leads: LeadDefinition[] = [
  {
    id: "u-lead-mitchelle",
    name: "Mitchelle Ndunge",
    track: null,
    leadershipTitle: "Chapter Lead",
    links: [
      { title: "GitHub", url: "https://github.com/Dahliastar" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/michelle-ndunge-7815482a2/" },
    ],
  },
  {
    id: "u-lead-rooney",
    name: "Rooney Odhiambo",
    track: null,
    leadershipTitle: "VC Chair",
    links: [
      { title: "GitHub", url: "https://github.com/KabuorJnr" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/rooney-odhiambo-9a26b6256/" },
    ],
  },
  {
    id: ADMIN_UID,
    name: "Mark Karuga",
    track: "cloud",
    leadershipTitle: "Cloud Track Lead",
  },
  {
    id: "u-lead-lewis",
    name: "Lewis Kagiri",
    track: "ai-ml",
    leadershipTitle: "AI/ML Track Lead",
    links: [
      { title: "GitHub", url: "https://github.com/10kwise" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/lewis-ndegwa-683718294/" },
    ],
  },
  {
    id: "u-lead-ian",
    name: "Ian Chacha",
    track: "mobile",
    leadershipTitle: "Mobile Track Lead",
    links: [{ title: "GitHub", url: "https://github.com/ianchacha" }],
  },
  {
    id: "u-lead-kimberly",
    name: "Kimberly Gift",
    track: "cybersecurity",
    leadershipTitle: "Cybersecurity Track Lead",
    links: [
      { title: "GitHub", url: "https://github.com/kimmy-sec" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/gift-kimberly-bb784b419/" },
    ],
  },
  {
    id: "u-lead-larah",
    name: "Larah Flynn",
    track: "women-in-tech",
    leadershipTitle: "Women in Tech Lead",
    links: [
      { title: "GitHub", url: "https://github.com/larah-del" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/larah-flynn-164b993a6/" },
    ],
  },
  {
    id: "u-lead-edith",
    name: "Edith Karanja",
    track: "hackathons-solutions",
    leadershipTitle: "Hackathons & Solutions",
    links: [
      { title: "GitHub", url: "https://github.com/edithcalm" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/edith-karanja/" },
    ],
  },
  {
    id: "u-lead-sam",
    name: "Sam Ryan",
    track: "web",
    leadershipTitle: "Web Development Track",
    links: [
      { title: "GitHub", url: "https://github.com/Ryanking254" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/samryan-adeny-6995a8436/" },
    ],
  },
];

const tracks: {
  slug: TrackSlug;
  name: string;
  color: "blue" | "red" | "green" | "yellow";
  description: string;
}[] = [
  { slug: "cloud", name: "Cloud", color: "blue", description: "Explore cloud platforms, infrastructure and deployment." },
  { slug: "cybersecurity", name: "Cybersecurity", color: "red", description: "Learn to identify risks and build more secure systems." },
  { slug: "web", name: "Web", color: "green", description: "Design, build and ship useful web experiences." },
  { slug: "women-in-tech", name: "Women in Tech", color: "yellow", description: "Create space for women to learn, collaborate and lead in technology." },
  { slug: "ai-ml", name: "AI/ML", color: "yellow", description: "Explore machine learning and AI by working with data, models and practical applications." },
  { slug: "mobile", name: "Mobile Development", color: "blue", description: "Learn to design and build useful applications for mobile devices." },
  { slug: "hackathons-solutions", name: "Hackathons & Solutions", color: "red", description: "Bring people together to solve real problems through collaborative, time-bound building challenges and hackathons." },
];

async function resolveLeadDocument(lead: LeadDefinition) {
  if (lead.id === ADMIN_UID) {
    const adminRef = db.collection("users").doc(ADMIN_UID);
    const adminSnap = await adminRef.get();
    if (!adminSnap.exists || adminSnap.get("name") !== "Mark Karuga" || adminSnap.get("role") !== "admin") {
      fail("The expected Mark Karuga admin document was not found exactly as expected; no writes were made.");
    }
    return { ref: adminRef, data: { track: lead.track, leadershipTitle: lead.leadershipTitle } };
  }

  const matches = await db.collection("users").where("name", "==", lead.name).get();
  if (matches.size > 1) fail(`Multiple user documents match "${lead.name}". Resolve duplicates before provisioning.`);
  const stableRef = db.collection("users").doc(lead.id);
  if (matches.empty) {
    const stableSnap = await stableRef.get();
    if (stableSnap.exists && stableSnap.get("name") !== lead.name) {
      fail(`Stable user ID ${lead.id} is already assigned to a different person.`);
    }
  }
  const ref = matches.empty ? stableRef : matches.docs[0].ref;
  return {
    ref,
    data: {
      name: lead.name,
      role: "lead",
      track: lead.track,
      leadershipTitle: lead.leadershipTitle,
      ...(lead.links ? { links: lead.links } : {}),
    },
  };
}

async function main() {
  const resolvedLeads = [];
  for (const lead of leads) resolvedLeads.push({ lead, ...(await resolveLeadDocument(lead)) });

  const leadIdsByTrack = new Map<TrackSlug, string[]>();
  for (const track of tracks) leadIdsByTrack.set(track.slug, []);
  for (const entry of resolvedLeads) {
    if (entry.lead.track) leadIdsByTrack.get(entry.lead.track)!.push(entry.ref.id);
  }

  const trackWrites = [];
  for (const track of tracks) {
    const matches = await db.collection("tracks").where("slug", "==", track.slug).get();
    if (matches.size > 1) fail(`Multiple track documents use slug "${track.slug}". Resolve duplicates before provisioning.`);
    const stableRef = db.collection("tracks").doc(track.slug);
    if (matches.empty) {
      const stableSnap = await stableRef.get();
      if (stableSnap.exists && stableSnap.get("slug") !== track.slug) {
        fail(`Track document ID ${track.slug} is occupied by a different track.`);
      }
    }
    const ref = matches.empty ? stableRef : matches.docs[0].ref;
    const data = matches.empty
      ? { ...track, leadIds: leadIdsByTrack.get(track.slug)! }
      : { slug: track.slug, leadIds: leadIdsByTrack.get(track.slug)! };
    trackWrites.push({ ref, data, isNew: matches.empty });
  }

  console.log(`Target project: ${PROJECT_ID}`);
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Leader profiles: ${resolvedLeads.length} (existing admin preserved)`);
  console.log(`Track documents: ${trackWrites.length}`);
  console.log("No events, writeups, posts, partners, or security rules will be changed.");
  if (!apply) {
    console.log("Dry run complete. Review the target and rerun with --apply plus the explicit confirmation environment variable to write.");
    return;
  }

  for (const entry of resolvedLeads) {
    await entry.ref.set(entry.data, { merge: true });
  }
  for (const entry of trackWrites) {
    await entry.ref.set(entry.data, { merge: true });
  }

  for (const entry of resolvedLeads) {
    const snap = await entry.ref.get();
    if (!snap.exists()) fail(`Verification failed for user document ${entry.ref.id}.`);
    if (snap.get("name") !== entry.lead.name) fail(`Verification failed for name on user document ${entry.ref.id}.`);
    if (snap.get("track") !== entry.lead.track) fail(`Verification failed for track on user document ${entry.ref.id}.`);
    if (snap.get("leadershipTitle") !== entry.lead.leadershipTitle) fail(`Verification failed for title on user document ${entry.ref.id}.`);
    if (entry.lead.id === ADMIN_UID && snap.get("role") !== "admin") fail("Admin role verification failed.");
    if (entry.lead.id !== ADMIN_UID && snap.get("role") !== "lead") fail(`Lead role verification failed for ${entry.ref.id}.`);
  }
  for (const entry of trackWrites) {
    const snap = await entry.ref.get();
    const expected = entry.data.leadIds as string[];
    const actual = snap.get("leadIds") as string[] | undefined;
    if (!snap.exists() || !actual || expected.some((id) => !actual.includes(id)) || actual.length !== expected.length) {
      fail(`Track verification failed for ${entry.ref.id}.`);
    }
  }
  console.log("Provisioning and read-back verification completed successfully.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

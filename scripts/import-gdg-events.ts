import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { GDG_OCTOBER_2026_EVENTS } from "../src/lib/gdg-events";

const PRODUCTION_PROJECT_ID = "gdg-tum-site";
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const allowProduction = args.has("--allow-production");

function abort(message: string): never {
  console.error(`event import aborted: ${message}`);
  process.exit(1);
}

function resolveProjectId(): string {
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialPath) {
    const projectId = JSON.parse(readFileSync(credentialPath, "utf8")).project_id as string | undefined;
    if (!projectId) abort(`${credentialPath} has no project_id`);
    return projectId;
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return process.env.FIREBASE_PROJECT_ID || abort("set FIREBASE_PROJECT_ID for the emulator");
  }
  return abort("set GOOGLE_APPLICATION_CREDENTIALS, or FIRESTORE_EMULATOR_HOST with FIREBASE_PROJECT_ID");
}

const projectId = resolveProjectId();
if (projectId === PRODUCTION_PROJECT_ID && !allowProduction) {
  abort('production writes require the explicit --allow-production flag');
}
if (projectId !== PRODUCTION_PROJECT_ID && !projectId.startsWith("demo-")) {
  abort(`refusing unrecognised project "${projectId}"; use a demo-* project or the explicitly approved production project`);
}
if (allowProduction && projectId !== PRODUCTION_PROJECT_ID) {
  abort("--allow-production was supplied, but the credentials do not target gdg-tum-site");
}

admin.initializeApp({
  projectId,
  ...(process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? { credential: admin.credential.cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"))) }
    : {}),
});

async function main() {
  const db = admin.firestore();
  console.log(`Target: ${projectId} (${process.env.FIRESTORE_EMULATOR_HOST ? "emulator" : "Firestore"})`);
  console.log(`Mode: ${apply ? "APPLY — create missing records only" : "DRY RUN — no writes"}`);

  const batch = db.batch();
  let toCreate = 0;
  let alreadyPresent = 0;
  let sourceDuplicates = 0;

  for (const event of GDG_OCTOBER_2026_EVENTS) {
    const ref = db.collection("events").doc(event.id);
    const [idSnapshot, sourceSnapshot] = await Promise.all([
      ref.get(),
      db.collection("events").where("sourceUrl", "==", event.sourceUrl).get(),
    ]);

    if (idSnapshot.exists) {
      alreadyPresent += 1;
      console.log(`SKIP existing document: ${event.id}`);
      continue;
    }
    if (!sourceSnapshot.empty) {
      sourceDuplicates += 1;
      console.warn(`SKIP source already represented by document(s): ${sourceSnapshot.docs.map((doc) => doc.id).join(", ")} — ${event.title}`);
      continue;
    }

    const { date, ...fields } = event;
    batch.create(ref, {
      ...fields,
      date: admin.firestore.Timestamp.fromDate(new Date(date)),
      status: "past",
    });
    toCreate += 1;
    console.log(`CREATE ${event.id}: ${event.title}`);
  }

  console.log(`Summary: ${toCreate} to create, ${alreadyPresent} already present, ${sourceDuplicates} source duplicates`);
  if (apply && toCreate > 0) {
    await batch.commit();
    console.log(`Created ${toCreate} event records.`);
  } else if (!apply) {
    console.log("No documents written. Re-run with --apply to create the missing records.");
  } else {
    console.log("Nothing to create.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

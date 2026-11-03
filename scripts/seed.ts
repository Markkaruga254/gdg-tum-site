import admin from "firebase-admin";
import { readFileSync } from "fs";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) { console.error("Set GOOGLE_APPLICATION_CREDENTIALS"); process.exit(1); }
const sa = JSON.parse(readFileSync(credPath, "utf8"));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  const leadCloud = await db.collection("users").add({ name: "[Lead name]", role: "lead", track: "cloud", bio: "[Bio]", photoUrl: "" });
  const leadCyber = await db.collection("users").add({ name: "[Lead name 2]", role: "lead", track: "cybersecurity", bio: "[Bio]", photoUrl: "" });

  const tracks = [
    { name: "Cloud", slug: "cloud", color: "blue", description: "[Description]", leadIds: [leadCloud.id] },
    { name: "Cybersecurity", slug: "cybersecurity", color: "red", description: "[Description]", leadIds: [leadCyber.id] },
    { name: "Web", slug: "web", color: "green", description: "[Description]", leadIds: [] },
    { name: "Women in Tech", slug: "women-in-tech", color: "yellow", description: "[Description]", leadIds: [] },
  ];
  for (const t of tracks) await db.collection("tracks").add(t);

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
main().catch(console.error);

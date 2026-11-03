// Firestore security-rules suite.
//
// Every case is a direct SDK operation against the emulator, never a UI
// assertion, because security rules are the only authorization boundary in this
// static export: /dashboard and /admin are served to anyone with HTTP 200.
//
// Positive paths matter as much as negative ones. assertFails() also passes when
// a rule expression *throws*, which is how the ticker and event-delete rules
// (F2, F3) stayed green while being broken. Cases marked "current behaviour"
// pin a defect that a later commit must convert; they fail on purpose when the
// rule is fixed, so the spec cannot silently drift.
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
} from "firebase/firestore";
import {
  actors, expectAllowed, expectDenied, expectDeniedForCrash, freshActor, loadTestEnv,
  report, requireEmulator, section, seedFixtures,
} from "./rules-fixtures.mjs";

requireEmulator();

const env = await loadTestEnv();
await seedFixtures(env);
const { anon, admin, leadCloud, leadWeb, leadCyber, member, otherMember } = actors(env);

// ---- tracks -----------------------------------------------------------------
section("tracks (rules:9-12) — public read, admin write");
await expectAllowed(() => getDocs(collection(anon, "tracks")), "anonymous reads the track list");
await expectAllowed(() => getDoc(doc(anon, "tracks", "cloud")), "anonymous reads one track");
await expectAllowed(() => setDoc(doc(admin, "tracks", "ai"), { name: "AI", slug: "ai" }), "admin creates a track");
await expectAllowed(() => updateDoc(doc(admin, "tracks", "cloud"), { description: "edited" }), "admin updates a track");
await expectAllowed(() => deleteDoc(doc(admin, "tracks", "web")), "admin deletes a track");
await expectDenied(() => setDoc(doc(leadCloud, "tracks", "hacker"), { name: "x", slug: "hacker" }), "lead cannot create a track");
await expectDenied(() => updateDoc(doc(leadCloud, "tracks", "cloud"), { name: "Renamed" }), "lead cannot rename a track");
await expectDenied(() => setDoc(doc(member, "tracks", "nope"), { name: "x", slug: "nope" }), "member cannot create a track");
await expectDenied(() => setDoc(doc(anon, "tracks", "nope"), { name: "x", slug: "nope" }), "anonymous cannot create a track");
await expectAllowed(() => getDoc(doc(anon, "tracks", "legacy-row")), "a track row with a legacy doc id is readable by its own id");

// ---- events -----------------------------------------------------------------
section("events — public read; create/update track-scoped; delete admin-only");
await expectAllowed(() => getDocs(collection(anon, "events")), "anonymous reads the event list");
await expectAllowed(() => getDoc(doc(anon, "events", "ev-cloud")), "anonymous reads one event");
await expectAllowed(() => addDoc(collection(leadCloud, "events"), { title: "New", trackId: "cloud", status: "upcoming" }), "cloud lead creates a cloud event");
await expectAllowed(() => addDoc(collection(admin, "events"), { title: "New", trackId: "web", status: "upcoming" }), "admin creates an event in any track");
await expectDenied(() => addDoc(collection(leadWeb, "events"), { title: "New", trackId: "cloud", status: "upcoming" }), "web lead cannot create a cloud event");
await expectDenied(() => addDoc(collection(member, "events"), { title: "New", trackId: "cloud", status: "upcoming" }), "member cannot create an event");
await expectDenied(() => addDoc(collection(anon, "events"), { title: "New", trackId: "cloud", status: "upcoming" }), "anonymous cannot create an event");
await expectAllowed(() => updateDoc(doc(leadCloud, "events", "ev-cloud"), { venue: "Moved" }), "cloud lead updates a cloud event");
await expectAllowed(() => updateDoc(doc(admin, "events", "ev-web"), { venue: "Moved" }), "admin updates any event");
await expectDenied(() => updateDoc(doc(leadWeb, "events", "ev-transfer"), { venue: "Moved" }), "web lead cannot edit a cloud event's details");
await expectDenied(() => updateDoc(doc(leadCloud, "events", "ev-transfer"), { trackId: "web" }), "cloud lead cannot push an event out of their track");
await expectAllowed(() => updateDoc(doc(leadWeb, "events", "ev-transfer"), { trackId: "web" }), "current behaviour: web lead pulls a cloud event into their own track (must flip in T03)");
await expectDenied(() => updateDoc(doc(member, "events", "ev-cloud"), { venue: "Moved" }), "member cannot update an event");
await expectAllowed(() => updateDoc(doc(leadCyber, "events", "ev-cyber"), { venue: "Moved" }), "cyber lead authorises on the slug value, not the tracks doc id");
await expectDenied(() => updateDoc(doc(leadCyber, "events", "ev-cyber"), { trackId: "cloud" }), "cyber lead cannot push an event out of their slug");
await expectDenied(() => updateDoc(doc(anon, "events", "ev-cloud"), { venue: "Moved" }), "anonymous cannot update an event");
await expectAllowed(() => deleteDoc(doc(admin, "events", "ev-web")), "admin deletes an event");
await expectDeniedForCrash(() => deleteDoc(doc(leadCloud, "events", "ev-cloud")), "cloud lead deletes a cloud event", "Null value error", "F3");
await expectDenied(() => deleteDoc(doc(anon, "events", "ev-cloud")), "anonymous deletes an event", { clean: true });

// ---- ticker ----------------------------------------------------------------
section("ticker — public read; writes are admin-only in practice (F2)");
await expectAllowed(() => getDocs(query(collection(anon, "ticker"), where("status", "==", "active"))), "anonymous reads active ticker rows");
await expectAllowed(() => addDoc(collection(admin, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-admin" }), "admin creates a ticker row");
await expectAllowed(() => updateDoc(doc(admin, "ticker", "tk-cloud"), { status: "inactive" }), "admin updates a ticker row");
await expectAllowed(() => deleteDoc(doc(admin, "ticker", "tk-web")), "admin deletes a ticker row");
await expectDenied(() => addDoc(collection(leadCloud, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-lead-cloud" }), "cloud lead cannot create a ticker row (F2: the intended grant never applies)", { clean: true });
await expectDenied(() => updateDoc(doc(leadCloud, "ticker", "tk-cloud"), { status: "active" }), "cloud lead cannot update a ticker row (F2)", { clean: true });
await expectDeniedForCrash(() => deleteDoc(doc(leadCloud, "ticker", "tk-cloud")), "cloud lead deletes a ticker row", "Null value error", "F2");
await expectDenied(() => addDoc(collection(member, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-member" }), "member cannot create a ticker row", { clean: true });

// ---- users -----------------------------------------------------------------
// The reads below are world-readable today. That is the exposure T05 closes:
// anyone can enumerate every member, their role and their track.
section("users — role/track drive every other rule; reads are public today (T05)");
await expectAllowed(() => getDoc(doc(anon, "users", "u-admin")), "current behaviour: anonymous reads any user record (T05 must flip)");
await expectAllowed(() => getDocs(collection(anon, "users")), "current behaviour: anonymous lists all users and roles (T05 must flip)");
await expectAllowed(() => getDoc(doc(member, "users", "u-other-member")), "current behaviour: a member reads another member (T05 must flip)");
await expectAllowed(() => getDoc(doc(member, "users", "u-member")), "member reads their own record");
await expectAllowed(() => setDoc(doc(freshActor(env, "u-fresh"), "users", "u-fresh"), { name: "Fresh", role: "member", track: null }), "a signed-in uid can create its own record as member");
await expectDenied(() => setDoc(doc(freshActor(env, "u-escalate"), "users", "u-escalate"), { name: "X", role: "lead", track: "cloud" }), "cannot create own record as lead");
await expectDenied(() => setDoc(doc(freshActor(env, "u-escalate2"), "users", "u-escalate2"), { name: "X", role: "admin", track: null }), "cannot create own record as admin");
await expectDenied(() => setDoc(doc(freshActor(env, "u-norole"), "users", "u-norole"), { name: "X" }), "cannot create own record without a role");
await expectDenied(() => setDoc(doc(member, "users", "u-someone-else"), { name: "X", role: "member" }), "cannot create another uid's record");
await expectAllowed(() => updateDoc(doc(member, "users", "u-member"), { name: "Renamed" }), "member renames themselves");
await expectAllowed(() => updateDoc(doc(member, "users", "u-member"), { bio: "hello", links: [] }), "member adds bio and links");
await expectDenied(() => updateDoc(doc(member, "users", "u-member"), { role: "admin" }), "user cannot promote self to admin");
await expectDenied(() => updateDoc(doc(leadCloud, "users", "u-lead-cloud"), { role: "admin" }), "lead cannot promote self to admin");
await expectDenied(() => updateDoc(doc(member, "users", "u-member"), { track: "cloud" }), "member cannot self-assign a track");
await expectAllowed(() => updateDoc(doc(admin, "users", "u-other-member"), { role: "lead", track: "web" }), "admin grants lead of a track");
await expectDenied(() => updateDoc(doc(member, "users", "u-admin"), { name: "hacked" }), "member cannot edit an admin's record");
await expectDenied(() => setDoc(doc(admin, "users", "u-made-up"), { name: "X", role: "lead", track: "cloud" }), "not even an admin can create another uid's record (rules:23 is self-create only; T12 must bootstrap profiles on first sign-in)");
await expectDenied(() => deleteDoc(doc(member, "users", "u-disposable")), "member cannot delete a user");
await expectAllowed(() => deleteDoc(doc(admin, "users", "u-disposable")), "admin deletes a user");

// ---- private_users ---------------------------------------------------------
section("private_users — email is owner-or-admin only");
await expectAllowed(() => getDoc(doc(member, "private_users", "u-member")), "owner reads own email");
await expectAllowed(() => getDoc(doc(admin, "private_users", "u-member")), "admin reads any email");
await expectDenied(() => getDoc(doc(otherMember, "private_users", "u-member")), "another user cannot read an email");
await expectDenied(() => getDoc(doc(anon, "private_users", "u-member")), "anonymous cannot read an email");
await expectAllowed(() => updateDoc(doc(member, "private_users", "u-member"), { email: "new@example.invalid" }), "owner updates own email");
await expectDenied(() => updateDoc(doc(otherMember, "private_users", "u-member"), { email: "stolen@example.invalid" }), "another user cannot rewrite an email");
await expectDenied(() => getDocs(collection(anon, "private_users")), "anonymous cannot list emails");

// ---- writeups --------------------------------------------------------------
section("writeups — drafts private; publishing authority is unmanaged today (T06)");
await expectAllowed(() => getDoc(doc(anon, "writeups", "w-published-cloud")), "anonymous reads a published writeup");
await expectAllowed(() => getDocs(query(collection(anon, "writeups"), where("status", "==", "published"))), "anonymous lists published writeups");
await expectDenied(() => getDocs(collection(anon, "writeups")), "anonymous cannot list writeups without a status filter");
await expectDenied(() => getDoc(doc(anon, "writeups", "w-draft-cloud")), "anonymous cannot read a draft");
await expectDenied(() => getDoc(doc(member, "writeups", "w-draft-cloud")), "a member cannot read someone else's draft");
await expectAllowed(() => getDoc(doc(leadCloud, "writeups", "w-draft-cloud")), "the author reads their own draft");
await expectAllowed(() => getDoc(doc(admin, "writeups", "w-draft-web")), "admin reads any draft");
await expectAllowed(() => addDoc(collection(leadCloud, "writeups"), { title: "D", eventId: "ev-cloud", trackId: "cloud", authorId: "u-lead-cloud", status: "draft", body: "b", tags: { topics: [], products: [] } }), "cloud lead creates a cloud draft for themselves");
await expectAllowed(() => addDoc(collection(leadCloud, "writeups"), { title: "P", eventId: "ev-cloud", trackId: "cloud", authorId: "u-lead-cloud", status: "published", body: "b", tags: { topics: [], products: [] } }), "current behaviour: lead self-publishes on create (must flip in T06)");
await expectDenied(() => addDoc(collection(leadCloud, "writeups"), { title: "D", eventId: "ev-web", trackId: "web", authorId: "u-lead-cloud", status: "draft", body: "b", tags: { topics: [], products: [] } }), "lead cannot create in another track");
await expectDenied(() => addDoc(collection(leadCloud, "writeups"), { title: "D", eventId: "ev-cloud", trackId: "cloud", authorId: "u-member", status: "draft", body: "b", tags: { topics: [], products: [] } }), "lead cannot attribute a writeup to someone else");
await expectDenied(() => addDoc(collection(member, "writeups"), { title: "D", eventId: "ev-cloud", trackId: "cloud", authorId: "u-member", status: "draft", body: "b", tags: { topics: [], products: [] } }), "member cannot create a writeup");
await expectAllowed(() => addDoc(collection(admin, "writeups"), { title: "A", eventId: "ev-web", trackId: "web", authorId: "u-lead-web", status: "published", body: "b", tags: { topics: [], products: [] } }), "admin creates a published writeup credited to a lead");
await expectAllowed(() => updateDoc(doc(leadCloud, "writeups", "w-draft-cloud"), { body: "edited" }), "author edits their draft body");
await expectAllowed(() => updateDoc(doc(leadCloud, "writeups", "w-flip-cloud"), { status: "published" }), "current behaviour: author publishes their own draft (must flip in T06)");
await expectAllowed(() => updateDoc(doc(leadCloud, "writeups", "w-flip-cloud"), { status: "draft" }), "current behaviour: author unpublishes their own writeup (must flip in T06)");
await expectDenied(() => updateDoc(doc(leadCloud, "writeups", "w-draft-cloud"), { authorId: "u-lead-web" }), "author cannot reassign attribution");
await expectDenied(() => updateDoc(doc(leadCloud, "writeups", "w-draft-cloud"), { trackId: "web" }), "author cannot move a writeup to another track");
await expectDenied(() => updateDoc(doc(leadWeb, "writeups", "w-draft-cloud"), { body: "vandal" }), "a lead cannot edit another author's draft");
await expectAllowed(() => updateDoc(doc(admin, "writeups", "w-draft-web"), { status: "published" }), "admin publishes another author's draft");
await expectAllowed(() => deleteDoc(doc(admin, "writeups", "w-draft-web")), "admin deletes a writeup");
await expectDenied(() => deleteDoc(doc(leadCloud, "writeups", "w-flip-cloud")), "author cannot delete their own draft");
await expectDenied(() => deleteDoc(doc(anon, "writeups", "w-published-cloud")), "anonymous cannot delete a writeup");
await expectAllowed(() => updateDoc(doc(admin, "writeups", "w-flip-cloud"), { authorId: "u-admin" }), "admin may reattribute a writeup (T06 keeps this and adds publishedBy)");

// ---- media -----------------------------------------------------------------
section("media — reads are gated on the parent writeup; there is no write rule at all (F1)");
await expectAllowed(() => getDoc(doc(anon, "media", "m-published")), "anonymous reads media on a published writeup");
await expectDenied(() => getDoc(doc(anon, "media", "m-draft")), "anonymous cannot read media on a draft");
await expectDenied(() => getDoc(doc(member, "media", "m-draft")), "a member cannot read media on someone else's draft");
await expectAllowed(() => getDoc(doc(leadCloud, "media", "m-draft")), "the author reads their own draft's media");
await expectAllowed(() => getDocs(query(collection(anon, "media"), where("writeupId", "==", "w-published-cloud"))), "anonymous lists media for a published writeup");
await expectDenied(() => addDoc(collection(admin, "media"), { writeupId: "w-published-cloud", url: "https://example.invalid/c.jpg", publicId: "fixture/c", createdBy: "u-admin" }), "current behaviour: not even an admin can create media (F1, must flip in T04)", { clean: true });
await expectDenied(() => addDoc(collection(leadCloud, "media"), { writeupId: "w-draft-cloud", url: "https://example.invalid/c.jpg", publicId: "fixture/c", createdBy: "u-lead-cloud" }), "current behaviour: a lead cannot create media (F1, must flip in T04)", { clean: true });
await expectDenied(() => updateDoc(doc(admin, "media", "m-published"), { caption: "hello" }), "current behaviour: an admin cannot caption media (F1, must flip in T04)", { clean: true });
await expectDenied(() => deleteDoc(doc(admin, "media", "m-published")), "current behaviour: an admin cannot delete media (F1, must flip in T04)", { clean: true });

// ---- default deny ----------------------------------------------------------
section("unmatched collections — deny everything (rules:39-41)");
await expectDenied(() => getDocs(collection(anon, "posts")), "anonymous cannot read posts (no rule, no writer, F4)", { clean: true });
await expectDenied(() => getDocs(collection(admin, "posts")), "admin cannot read posts (F4)", { clean: true });
await expectDenied(() => setDoc(doc(admin, "posts", "p1"), { title: "x" }), "admin cannot create a post", { clean: true });
await expectDenied(() => setDoc(doc(admin, "auditlogs", "a1"), { x: 1 }), "admin cannot write an unknown collection", { clean: true });
await expectDenied(() => setDoc(doc(leadCloud, "public_profiles", "u-lead-cloud"), { name: "x" }), "no public_profiles rule exists yet (T05 adds it)", { clean: true });

await env.cleanup();
report();

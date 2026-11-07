// Firestore security-rules suite.
//
// Every case is a direct SDK operation against the emulator, never a UI
// assertion, because security rules are the only authorization boundary in this
// static export: /dashboard and /admin are served to anyone with HTTP 200.
//
// Positive and negative paths are both exercised. Every denial uses a real
// Firestore predicate; the suite must not pass because a rule expression throws.
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where,
} from "firebase/firestore";
import {
  actors, expectAllowed, expectDenied, freshActor, loadTestEnv,
  report, requireEmulator, section, seedFixtures,
} from "./rules-fixtures.mjs";

requireEmulator();

const env = await loadTestEnv();
await seedFixtures(env);
const { anon, admin, leadCloud, leadCloudSecondary, leadWeb, leadCyber, member, otherMember } = actors(env);

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
await expectDenied(() => updateDoc(doc(leadWeb, "events", "ev-transfer"), { trackId: "web" }), "web lead cannot pull a cloud event into their track");
await expectDenied(() => updateDoc(doc(member, "events", "ev-cloud"), { venue: "Moved" }), "member cannot update an event");
await expectAllowed(() => updateDoc(doc(leadCyber, "events", "ev-cyber"), { venue: "Moved" }), "cyber lead authorises on the slug value, not the tracks doc id");
await expectDenied(() => updateDoc(doc(leadCyber, "events", "ev-cyber"), { trackId: "cloud" }), "cyber lead cannot push an event out of their slug");
await expectDenied(() => updateDoc(doc(anon, "events", "ev-cloud"), { venue: "Moved" }), "anonymous cannot update an event");
await expectAllowed(() => deleteDoc(doc(admin, "events", "ev-web")), "admin deletes an event");
await expectDenied(() => deleteDoc(doc(leadCloud, "events", "ev-cloud")), "cloud lead cannot delete an event (cancel instead)", { clean: true });
await expectDenied(() => deleteDoc(doc(anon, "events", "ev-cloud")), "anonymous deletes an event", { clean: true });

// Cancellation is a status write, so it travels under the update rule. cancelledBy
// is only checked when it changes, so an unrelated edit to an already-cancelled
// event must not be blocked by someone else's stamp.
section("events — cancellation stamp cannot be forged");
await expectAllowed(() => updateDoc(doc(leadCloud, "events", "ev-cloud"), { status: "cancelled", cancelledBy: "u-lead-cloud" }), "cloud lead cancels their own event and signs it");
await expectDenied(() => updateDoc(doc(leadCloud, "events", "ev-cloud"), { status: "cancelled", cancelledBy: "u-lead-web" }), "cloud lead cannot sign a cancellation as the web lead");
await expectAllowed(() => updateDoc(doc(leadCloud, "events", "ev-cancelled"), { venue: "Renamed" }), "cloud lead edits an event another lead cancelled");
await expectAllowed(() => updateDoc(doc(admin, "events", "ev-cancelled"), { status: "upcoming", cancelledBy: null }), "admin restores a cancelled event");

// ---- ticker ----------------------------------------------------------------
section("ticker — public read; leads manage their track's events, admins any row");
await expectAllowed(() => getDocs(query(collection(anon, "ticker"), where("status", "==", "active"))), "anonymous reads active ticker rows");
await expectAllowed(() => addDoc(collection(admin, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-admin" }), "admin creates a ticker row");
await expectAllowed(() => updateDoc(doc(admin, "ticker", "tk-cloud"), { status: "inactive" }), "admin updates a ticker row");
await expectDenied(() => updateDoc(doc(admin, "ticker", "tk-cloud"), { eventId: "ev-web" }), "admin cannot change a ticker eventId");
await expectDenied(() => updateDoc(doc(admin, "ticker", "tk-cloud"), { message: "x".repeat(141) }), "admin ticker messages are capped at 140 characters");
await expectDenied(() => updateDoc(doc(admin, "ticker", "tk-cloud"), { message: "" }), "admin cannot clear a ticker message");
await expectDenied(() => updateDoc(doc(leadCloud, "ticker", "tk-cloud"), { eventId: "ev-web" }), "lead cannot move a ticker row to another event");
await expectDenied(() => updateDoc(doc(leadCloud, "ticker", "tk-cloud"), { message: "" }), "lead cannot clear a ticker message");
await expectDenied(() => updateDoc(doc(leadCloud, "ticker", "tk-cloud"), { message: "x".repeat(141) }), "lead cannot exceed the ticker message limit");
await expectAllowed(() => deleteDoc(doc(admin, "ticker", "tk-web")), "admin deletes a ticker row");
await expectAllowed(() => addDoc(collection(leadCloud, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-lead-cloud" }), "cloud lead creates a ticker row for a cloud event");
await expectAllowed(() => updateDoc(doc(leadCloud, "ticker", "tk-cloud"), { status: "active" }), "cloud lead activates their own cloud ticker row");
await expectAllowed(() => deleteDoc(doc(leadCloud, "ticker", "tk-cloud")), "cloud lead deletes their own cloud ticker row");
await setDoc(doc(admin, "ticker", "tk-cloud-admin-created"), { eventId: "ev-cloud", message: "Admin-created row", status: "inactive", createdBy: "u-admin" });
await expectAllowed(() => updateDoc(doc(leadCloud, "ticker", "tk-cloud-admin-created"), { status: "active" }), "cloud lead manages another creator's ticker row in their own track");
await expectAllowed(() => deleteDoc(doc(leadCloud, "ticker", "tk-cloud-admin-created")), "cloud lead removes another creator's ticker row in their own track");
await expectDenied(() => addDoc(collection(leadCloud, "ticker"), { eventId: "ev-web", message: "hi", status: "inactive", createdBy: "u-lead-cloud" }), "cloud lead cannot ticker a web event", { clean: true });
await expectDenied(() => addDoc(collection(leadWeb, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-lead-web" }), "web lead cannot ticker a cloud event", { clean: true });
await expectDenied(() => addDoc(collection(member, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-member" }), "member cannot create a ticker row", { clean: true });
await expectDenied(() => addDoc(collection(anon, "ticker"), { eventId: "ev-cloud", message: "hi", status: "inactive", createdBy: "u-anon" }), "anonymous cannot create a ticker row", { clean: true });
await expectDenied(() => updateDoc(doc(leadCloud, "ticker", "tk-web"), { status: "active" }), "cloud lead cannot update a web ticker row");
await expectDenied(() => deleteDoc(doc(leadCloud, "ticker", "tk-web")), "cloud lead cannot delete a web ticker row");
await expectDenied(() => updateDoc(doc(leadWeb, "ticker", "tk-cloud"), { status: "active" }), "web lead cannot update another lead's cloud ticker row");
await expectDenied(() => addDoc(collection(leadCloud, "ticker"), { eventId: "ev-cloud", message: "x".repeat(141), status: "inactive", createdBy: "u-lead-cloud" }), "ticker message over 140 characters is rejected", { clean: true });
await expectDenied(() => addDoc(collection(leadCloud, "ticker"), { eventId: "ev-cloud", message: "", status: "inactive", createdBy: "u-lead-cloud" }), "empty ticker message is rejected", { clean: true });
await expectDenied(() => addDoc(collection(leadCloud, "ticker"), { eventId: "missing-event", message: "hi", status: "inactive", createdBy: "u-lead-cloud" }), "ticker cannot reference a missing event", { clean: true });

// ---- users -----------------------------------------------------------------
// Public user docs hold no email; emails live in private_users.
section("users — public read; emails are private_users-only");
await expectAllowed(() => getDoc(doc(anon, "users", "u-admin")), "anonymous can read a user doc");
await expectAllowed(() => getDocs(collection(anon, "users")), "anonymous can list user docs");
await expectAllowed(() => getDoc(doc(member, "users", "u-other-member")), "anyone can read another member's public doc");
await expectAllowed(() => getDoc(doc(member, "users", "u-member")), "member reads their own record");
await expectAllowed(() => setDoc(doc(freshActor(env, "u-fresh"), "users", "u-fresh"), { name: "Fresh", role: "member", track: null }), "a signed-in uid can create its own record as member");
await expectDenied(() => setDoc(doc(freshActor(env, "u-fresh-email"), "users", "u-fresh-email"), { name: "Fresh", role: "member", track: null, email: "public@example.invalid" }), "users create rejects an email field", { clean: true });
await expectDenied(() => setDoc(doc(freshActor(env, "u-escalate"), "users", "u-escalate"), { name: "X", role: "lead", track: "cloud" }), "cannot create own record as lead");
await expectDenied(() => setDoc(doc(freshActor(env, "u-escalate2"), "users", "u-escalate2"), { name: "X", role: "admin", track: null }), "cannot create own record as admin");
await expectDenied(() => setDoc(doc(freshActor(env, "u-norole"), "users", "u-norole"), { name: "X" }), "cannot create own record without a role", { clean: true });
await expectDenied(() => setDoc(doc(member, "users", "u-someone-else"), { name: "X", role: "member" }), "cannot create another uid's record");
await expectAllowed(() => updateDoc(doc(member, "users", "u-member"), { name: "Renamed" }), "member renames themselves");
await expectAllowed(() => updateDoc(doc(member, "users", "u-member"), { bio: "hello", links: [] }), "member adds bio and links");
await expectDenied(() => updateDoc(doc(member, "users", "u-member"), { email: "public@example.invalid" }), "users update rejects an email field", { clean: true });
await expectDenied(() => updateDoc(doc(admin, "users", "u-member"), { email: "public@example.invalid" }), "admin cannot add an email to a public user doc", { clean: true });
await expectDenied(() => updateDoc(doc(member, "users", "u-member"), { role: "admin" }), "user cannot promote self to admin");
await expectDenied(() => updateDoc(doc(leadCloud, "users", "u-lead-cloud"), { role: "admin" }), "lead cannot promote self to admin");
await expectDenied(() => updateDoc(doc(member, "users", "u-member"), { track: "cloud" }), "member cannot self-assign a track");
await expectAllowed(() => updateDoc(doc(admin, "users", "u-other-member"), { role: "lead", track: "web" }), "admin grants lead of a track");
await expectDenied(() => updateDoc(doc(member, "users", "u-admin"), { name: "hacked" }), "member cannot edit an admin's record");
await expectDenied(() => setDoc(doc(admin, "users", "u-made-up"), { name: "X", role: "lead", track: "cloud" }), "not even an admin can create another uid's record (rules:23 is self-create only; T12 must bootstrap profiles on first sign-in)");
await expectDenied(() => deleteDoc(doc(member, "users", "u-disposable")), "member cannot delete a user");
await expectAllowed(() => deleteDoc(doc(admin, "users", "u-disposable")), "admin deletes a user");

// ---- private_users ---------------------------------------------------------
section("private_users — owner-or-admin only (emails live here)");
await expectAllowed(() => getDoc(doc(member, "private_users", "u-member")), "owner reads own email");
await expectAllowed(() => getDoc(doc(admin, "private_users", "u-member")), "admin reads any email");
await expectDenied(() => getDoc(doc(otherMember, "private_users", "u-member")), "another user cannot read an email");
await expectDenied(() => getDoc(doc(anon, "private_users", "u-member")), "anonymous cannot read an email");
await expectAllowed(() => updateDoc(doc(member, "private_users", "u-member"), { email: "new@example.invalid" }), "owner updates own email");
await expectDenied(() => updateDoc(doc(otherMember, "private_users", "u-member"), { email: "stolen@example.invalid" }), "another user cannot rewrite an email");
await expectDenied(() => getDocs(collection(anon, "private_users")), "anonymous cannot list emails");

// ---- writeups --------------------------------------------------------------
section("writeups — drafts private; current track leads publish/unpublish their own writeups");
await expectAllowed(() => getDoc(doc(anon, "writeups", "w-published-cloud")), "anonymous reads a published writeup");
await expectAllowed(() => getDocs(query(collection(anon, "writeups"), where("status", "==", "published"))), "anonymous lists published writeups");
await expectDenied(() => getDocs(collection(anon, "writeups")), "anonymous cannot list writeups without a status filter", { clean: true });
await expectDenied(() => getDoc(doc(anon, "writeups", "w-draft-cloud")), "anonymous cannot read a draft");
await expectDenied(() => getDoc(doc(member, "writeups", "w-draft-cloud")), "a member cannot read someone else's draft");
await expectAllowed(() => getDoc(doc(leadCloud, "writeups", "w-draft-cloud")), "the author reads their own draft");
await expectAllowed(() => getDoc(doc(admin, "writeups", "w-draft-web")), "admin reads any draft");
await expectAllowed(() => addDoc(collection(leadCloud, "writeups"), { title: "D", eventId: "ev-cloud", trackId: "cloud", authorId: "u-lead-cloud", status: "draft", body: "b", tags: { topics: [], products: [] } }), "cloud lead creates a cloud draft for themselves");
await expectAllowed(() => addDoc(collection(leadCloud, "writeups"), { title: "P", eventId: "ev-cloud", trackId: "cloud", authorId: "u-lead-cloud", status: "published", body: "b", tags: { topics: [], products: [] } }), "cloud lead creates a cloud writeup as published");
await expectDenied(() => addDoc(collection(leadCloud, "writeups"), { title: "D", eventId: "ev-web", trackId: "web", authorId: "u-lead-cloud", status: "draft", body: "b", tags: { topics: [], products: [] } }), "lead cannot create in another track");
await expectDenied(() => addDoc(collection(leadCloud, "writeups"), { title: "D", eventId: "ev-cloud", trackId: "cloud", authorId: "u-member", status: "draft", body: "b", tags: { topics: [], products: [] } }), "lead cannot attribute a writeup to someone else");
await expectDenied(() => addDoc(collection(member, "writeups"), { title: "D", eventId: "ev-cloud", trackId: "cloud", authorId: "u-member", status: "draft", body: "b", tags: { topics: [], products: [] } }), "member cannot create a writeup");
await expectAllowed(() => addDoc(collection(admin, "writeups"), { title: "A", eventId: "ev-web", trackId: "web", authorId: "u-lead-web", status: "published", body: "b", tags: { topics: [], products: [] } }), "admin creates a published writeup credited to a lead");
await expectAllowed(() => updateDoc(doc(leadCloud, "writeups", "w-draft-cloud"), { body: "edited" }), "author edits their draft body");
await expectAllowed(() => updateDoc(doc(leadCloud, "writeups", "w-draft-cloud"), { status: "published" }), "lead publishes their own draft");
await expectAllowed(() => updateDoc(doc(leadCloud, "writeups", "w-flip-cloud"), { status: "draft" }), "lead unpublishes their own writeup");
await updateDoc(doc(admin, "users", "u-lead-cloud"), { track: "web" });
await expectDenied(() => updateDoc(doc(leadCloud, "writeups", "w-flip-cloud"), { body: "lead no longer owns this track" }), "former track lead cannot update their old writeup");
await updateDoc(doc(admin, "users", "u-lead-cloud"), { track: "cloud" });
await expectDenied(() => updateDoc(doc(leadCloud, "writeups", "w-draft-cloud"), { authorId: "u-lead-web" }), "author cannot reassign attribution");
await expectDenied(() => updateDoc(doc(leadCloud, "writeups", "w-draft-cloud"), { trackId: "web" }), "author cannot move a writeup to another track");
await expectDenied(() => updateDoc(doc(leadWeb, "writeups", "w-draft-cloud"), { body: "vandal" }), "a lead cannot edit another author's draft");
await expectAllowed(() => updateDoc(doc(admin, "writeups", "w-draft-web"), { status: "published" }), "admin publishes another author's draft");
await expectAllowed(() => deleteDoc(doc(admin, "writeups", "w-draft-web")), "admin deletes a writeup");
await expectDenied(() => deleteDoc(doc(leadCloud, "writeups", "w-flip-cloud")), "author cannot delete their own writeup");
await expectDenied(() => deleteDoc(doc(anon, "writeups", "w-published-cloud")), "anonymous cannot delete a writeup");
await expectDenied(() => updateDoc(doc(admin, "writeups", "w-flip-cloud"), { authorId: "u-admin" }), "admin cannot change writeup attribution");

// ---- media -----------------------------------------------------------------
section("media — published/admin/author reads; author-or-admin writes only");
await expectAllowed(() => getDoc(doc(anon, "media", "m-published")), "anonymous reads media on a published writeup");
await expectDenied(() => getDoc(doc(anon, "media", "m-draft")), "anonymous cannot read media on a draft");
await expectDenied(() => getDoc(doc(member, "media", "m-draft")), "a member cannot read media on someone else's draft");
    await expectAllowed(() => getDoc(doc(leadCloud, "media", "m-draft")), "the author reads their own draft's media");
await expectDenied(() => getDoc(doc(leadCloudSecondary, "media", "m-draft")), "a different lead of the same track cannot read another author's draft media");
    await expectAllowed(() => getDoc(doc(admin, "media", "m-draft")), "admin reads media on someone else's draft");
await expectAllowed(() => getDoc(doc(admin, "media", "m-orphan")), "admin can read media even if its parent writeup was removed");
await expectDenied(() => getDoc(doc(anon, "media", "m-orphan")), "anonymous cannot read media whose parent writeup is missing");
    await expectAllowed(() => getDocs(query(collection(anon, "media"), where("writeupId", "==", "w-published-cloud"))), "anonymous lists media for a published writeup");
await expectAllowed(() => addDoc(collection(admin, "media"), { writeupId: "w-published-cloud", url: "https://example.invalid/c.jpg", publicId: "fixture/c", createdBy: "u-admin" }), "admin creates media on a published writeup");
await expectAllowed(() => addDoc(collection(leadCloud, "media"), { writeupId: "w-draft-cloud", url: "https://example.invalid/c.jpg", publicId: "fixture/c", createdBy: "u-lead-cloud" }), "cloud lead creates media on their own cloud draft");
await expectAllowed(() => updateDoc(doc(admin, "media", "m-published"), { caption: "hello" }), "admin captions media");
await expectDenied(() => updateDoc(doc(admin, "media", "m-published"), { writeupId: "w-draft-web" }), "admin cannot reparent existing media");
await expectAllowed(() => deleteDoc(doc(admin, "media", "m-published")), "admin deletes media");
await expectAllowed(() => updateDoc(doc(leadCloud, "media", "m-draft"), { caption: "edited" }), "writeup author captions their own draft's media");
await expectDenied(() => addDoc(collection(leadCloudSecondary, "media"), { writeupId: "w-published-cloud", url: "https://example.invalid/x.jpg", createdBy: "u-lead-cloud-secondary" }), "same-track lead cannot create media for another author", { clean: true });
await expectDenied(() => updateDoc(doc(leadCloudSecondary, "media", "m-draft"), { caption: "not the author" }), "same-track lead cannot update another author's media", { clean: true });
await expectDenied(() => deleteDoc(doc(leadCloudSecondary, "media", "m-draft")), "same-track lead cannot delete another author's media", { clean: true });
await expectDenied(() => addDoc(collection(member, "media"), { writeupId: "w-published-cloud", url: "https://example.invalid/c.jpg", publicId: "fixture/c", createdBy: "u-member" }), "member cannot create media", { clean: true });
await expectDenied(() => addDoc(collection(anon, "media"), { writeupId: "w-published-cloud", url: "https://example.invalid/c.jpg", publicId: "fixture/c", createdBy: "u-anon" }), "anonymous cannot create media", { clean: true });
await expectDenied(() => addDoc(collection(leadCloud, "media"), { writeupId: "w-draft-web", url: "https://example.invalid/c.jpg", publicId: "fixture/c", createdBy: "u-lead-cloud" }), "cloud lead cannot create media on a web writeup", { clean: true });
await expectDenied(() => updateDoc(doc(leadWeb, "media", "m-draft"), { caption: "vandal" }), "web lead cannot caption cloud lead's draft media", { clean: true });
await expectDenied(() => deleteDoc(doc(member, "media", "m-published")), "member cannot delete media");

// ---- posts ---------------------------------------------------------------
section("posts — public read, no client writes (news bot uses Admin SDK)");
await expectAllowed(() => getDocs(collection(anon, "posts")), "anonymous can read posts");
await expectAllowed(() => getDoc(doc(anon, "posts", "p1")), "anonymous can read one post");
await expectDenied(() => addDoc(collection(anon, "posts"), { title: "x", summary: "s", sourceName: "n", sourceUrl: "https://example.invalid", tags: [], fetchedAt: new Date() }), "anonymous cannot write posts", { clean: true });
await expectDenied(() => addDoc(collection(member, "posts"), { title: "x", summary: "s", sourceName: "n", sourceUrl: "https://example.invalid", tags: [], fetchedAt: new Date() }), "member cannot write posts", { clean: true });
await expectDenied(() => addDoc(collection(leadCloud, "posts"), { title: "x", summary: "s", sourceName: "n", sourceUrl: "https://example.invalid", tags: [], fetchedAt: new Date() }), "lead cannot write posts", { clean: true });
await expectDenied(() => addDoc(collection(admin, "posts"), { title: "x", summary: "s", sourceName: "n", sourceUrl: "https://example.invalid", tags: [], fetchedAt: new Date() }), "admin cannot write posts from client", { clean: true });

// ---- partners -------------------------------------------------------------
section("partners — public read, admin write only");
await expectAllowed(() => getDocs(collection(anon, "partners")), "anonymous can read partners");
await expectAllowed(() => getDoc(doc(anon, "partners", "partner-u")), "anonymous can read one partner");
await expectDenied(() => addDoc(collection(member, "partners"), { name: "X", link: "https://example.invalid", type: "company", order: 1, active: true }), "member cannot create a partner", { clean: true });
await expectDenied(() => addDoc(collection(leadCloud, "partners"), { name: "X", link: "https://example.invalid", type: "company", order: 1, active: true }), "lead cannot create a partner", { clean: true });
await expectDenied(() => addDoc(collection(anon, "partners"), { name: "X", link: "https://example.invalid", type: "company", order: 1, active: true }), "anonymous cannot create a partner", { clean: true });
await expectAllowed(() => addDoc(collection(admin, "partners"), { name: "New Partner", link: "https://example.invalid", type: "company", order: 1, active: true }), "admin can create a partner");
await expectAllowed(() => updateDoc(doc(admin, "partners", "partner-u"), { name: "Updated University" }), "admin can update a partner");
await expectAllowed(() => deleteDoc(doc(admin, "partners", "partner-s")), "admin can delete a partner");

// ---- default deny ----------------------------------------------------------
section("unmatched collections — deny everything (rules:39-41)");
await expectDenied(() => setDoc(doc(admin, "auditlogs", "a1"), { x: 1 }), "admin cannot write an unknown collection", { clean: true });
await expectDenied(() => setDoc(doc(leadCloud, "public_profiles", "u-lead-cloud"), { name: "x" }), "no public_profiles rule exists yet (T05 adds it)", { clean: true });

await env.cleanup();
report();

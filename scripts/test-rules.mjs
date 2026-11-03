import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const rules = readFileSync("firestore.rules", "utf8");
const env = await initializeTestEnvironment({ projectId: "gdg-tum-site", firestore: { rules } });

// member cannot write events
const member = env.authenticatedContext("member1", { sub: "member1" });
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "users", "member1"), { name: "m", role: "member", track: null });
});
const memberDb = member.firestore();
await assertFails(setDoc(doc(memberDb, "events", "e1"), { title: "x", trackId: "cloud", status: "upcoming" }));

// user cannot promote self
await assertFails(updateDoc(doc(memberDb, "users", "member1"), { role: "admin" }));

// private_users owner read
const owner = env.authenticatedContext("owner1", { sub: "owner1" });
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "private_users", "owner1"), { email: "a@b.com" });
});
await assertSucceeds(getDoc(doc(owner.firestore(), "private_users", "owner1")));
const other = env.authenticatedContext("other1", { sub: "other1" });
await assertFails(getDoc(doc(other.firestore(), "private_users", "owner1")));

await env.cleanup();
console.log("ALL RULE TESTS PASSED");

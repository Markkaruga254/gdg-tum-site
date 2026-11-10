import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/server.js";

function fixture({ role = "lead", track = "cloud", eventTrack = "cloud", writeup = null, tokenValid = true } = {}) {
  const users = { "lead-1": { role, track } };
  const events = { "event-1": { title: "Cloud fundamentals", trackId: eventTrack, venue: "Online", description: "Introductory session" } };
  const writeups = writeup ? { "writeup-1": writeup } : {};
  const media = {};
  const usage = {};
  const db = {
    collection(name) {
      return {
        doc(id) {
          return {
            async get() {
              const store = ({ users, events, writeups, media, ai_usage: usage })[name];
              return { exists: Object.hasOwn(store, id), data: () => store[id] };
            },
          };
        },
      };
    },
    async runTransaction(callback) {
      const transaction = {
        async get(ref) { return { exists: Object.hasOwn(usage, ref.id), data: () => usage[ref.id] }; },
        set(ref, value) { usage[ref.id] = value; },
      };
      return callback(transaction);
    },
  };
  // Firestore document refs need their id for the in-memory transaction adapter.
  const originalCollection = db.collection;
  db.collection = (name) => ({
    doc(id) {
      const ref = originalCollection(name).doc(id);
      ref.id = id;
      return ref;
    },
  });
  const auth = {
    async verifyIdToken(token) {
      if (!tokenValid || token !== "valid-token") throw new Error("invalid");
      return { uid: "lead-1" };
    },
  };
  const genAI = {
    models: {
      async generateContent() {
        return { text: JSON.stringify({
          title: "Cloud fundamentals recap",
          summary: "A practical introduction to cloud computing and Google Cloud.",
          body: "## What we covered\n\nCloud computing fundamentals.",
          topicTags: ["cloud", "invented-tag"],
          productTags: ["google-cloud"],
        }) };
      },
    },
  };
  return { app: createApp({ auth, db, genAI, allowedOrigins: ["https://gdg-tum-site.web.app"], cloudinaryCloudName: "gdgtum" }), usage };
}

async function withServer(app, callback) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await callback(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("requires a valid Firebase ID token", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/writeups/draft`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: "event-1", notes: "We covered cloud computing basics and IAM." }),
    });
    assert.equal(response.status, 401);
  });
});

test("rejects a lead generating for an event outside their track", async () => {
  const { app } = fixture({ eventTrack: "web" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/writeups/draft`, {
      method: "POST", headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ eventId: "event-1", notes: "We covered cloud computing basics and IAM." }),
    });
    assert.equal(response.status, 403);
  });
});

test("returns an editable draft and filters unsupported tags", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/writeups/draft`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json", origin: "https://gdg-tum-site.web.app" },
      body: JSON.stringify({ eventId: "event-1", notes: "We covered cloud computing basics, IAM and least privilege." }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.draft.title, "Cloud fundamentals recap");
    assert.deepEqual(payload.draft.topicTags, ["cloud"]);
    assert.deepEqual(payload.draft.productTags, ["google-cloud"]);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://gdg-tum-site.web.app");
  });
});

test("rejects browser requests from an unapproved origin", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/writeups/draft`, {
      method: "POST", headers: { authorization: "Bearer valid-token", "content-type": "application/json", origin: "https://evil.invalid" },
      body: JSON.stringify({ eventId: "event-1", notes: "We covered cloud computing basics and IAM." }),
    });
    assert.equal(response.status, 403);
  });
});

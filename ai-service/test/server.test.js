import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/server.js";

function fixture({ role = "lead", track = "cloud", eventTrack = "cloud", writeup = null, mediaRecords = {}, tokenValid = true, fetchImpl = fetch } = {}) {
  const users = { "lead-1": { role, track } };
  const events = { "event-1": { title: "Cloud fundamentals", trackId: eventTrack, venue: "Online", description: "Introductory session" } };
  const writeups = writeup ? { "writeup-1": writeup } : {};
  const media = mediaRecords;
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
      async generateContent({ contents }) {
        if (Array.isArray(contents)) return { text: JSON.stringify({ caption: "Members working through a cloud computing demonstration.", altText: "Participants gathered around a laptop during a technical session." }) };
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
  return { app: createApp({ auth, db, genAI, allowedOrigins: ["https://gdg-tum-site.web.app"], cloudinaryCloudName: "gdgtum", fetchImpl }), usage };
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

test("requires explicit consent before sending photos to Gemini", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/media/captions`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ writeupId: "writeup-1", mediaIds: ["media-1"], consentConfirmed: false }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Confirm that the people shown/);
  });
});

test("returns photo caption suggestions for authorized writeup media without saving them", async () => {
  const mediaUrl = "https://res.cloudinary.com/gdgtum/image/upload/v123/sample.jpg";
  const { app } = fixture({
    writeup: { authorId: "lead-1", trackId: "cloud", eventId: "event-1" },
    mediaRecords: { "media-1": { writeupId: "writeup-1", url: mediaUrl, caption: "Existing caption" } },
    fetchImpl: async (url, options) => {
      assert.equal(url, mediaUrl);
      assert.equal(options.redirect, "error");
      return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg", "content-length": "3" } });
    },
  });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/media/captions`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ writeupId: "writeup-1", mediaIds: ["media-1"], consentConfirmed: true }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.captions[0].mediaId, "media-1");
    assert.match(payload.captions[0].caption, /Members working/);
    assert.equal(payload.captions[0].altText.length > 0, true);
  });
});

test("rejects image URLs outside the configured Cloudinary account", async () => {
  const { app } = fixture({
    writeup: { authorId: "lead-1", trackId: "cloud", eventId: "event-1" },
    mediaRecords: { "media-1": { writeupId: "writeup-1", url: "https://example.invalid/image.jpg" } },
  });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/media/captions`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ writeupId: "writeup-1", mediaIds: ["media-1"], consentConfirmed: true }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Cloudinary account/);
  });
});

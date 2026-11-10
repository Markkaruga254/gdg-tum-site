import test from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/server.js";
import { generateWithRetry } from "../src/gemini-retry.js";

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
  return { app: createApp({ auth, db, genAI, allowedOrigins: ["https://gdg-tum-site.web.app"], cloudinaryCloudName: "gdgtum", cloudinaryApiKey: "test-api-key", cloudinaryApiSecret: "test-secret", fetchImpl }), usage };
}

async function withServer(app, callback) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await callback(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("allows a signed-in lead to request a profile upload signature", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/cloudinary/sign-upload`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ purpose: "profile" }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.cloudName, "gdgtum");
    assert.equal(payload.apiKey, "test-api-key");
    assert.match(payload.publicId, /^gdg-tum\/profiles\/lead-1\//);
    assert.equal(typeof payload.timestamp, "number");
    assert.match(payload.signature, /^[a-f0-9]{64}$/);
    const canonical = `public_id=${payload.publicId}&timestamp=${payload.timestamp}test-secret`;
    assert.equal(payload.signature, createHash("sha256").update(canonical).digest("hex"));
  });
});

test("prevents track leads from requesting standalone gallery upload signatures", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/cloudinary/sign-upload`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ purpose: "gallery" }),
    });
    assert.equal(response.status, 403);
  });
});

test("allows only admins to sign and destroy standalone gallery photos", async () => {
  const { app } = fixture({
    role: "admin",
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, "POST");
      return new Response(JSON.stringify({ result: "ok" }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  await withServer(app, async (base) => {
    const signed = await fetch(`${base}/v1/cloudinary/sign-upload`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ purpose: "gallery" }),
    });
    assert.equal(signed.status, 200);
    assert.match((await signed.json()).publicId, /^gdg-tum\/gallery\//);
    const removed = await fetch(`${base}/v1/cloudinary/destroy-gallery-photo`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ publicId: "gdg-tum/gallery/session-1" }),
    });
    assert.equal(removed.status, 200);
    assert.deepEqual(await removed.json(), { result: "ok" });
  });
});

test("prevents track leads from destroying standalone gallery assets", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/cloudinary/destroy-gallery-photo`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ publicId: "gdg-tum/gallery/session-1" }),
    });
    assert.equal(response.status, 403);
  });
});

test("rejects gallery deletion outside the dedicated gallery folder", async () => {
  const { app } = fixture({ role: "admin" });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/cloudinary/destroy-gallery-photo`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ publicId: "gdg-tum/profiles/lead-1/photo" }),
    });
    assert.equal(response.status, 400);
  });
});

test("exposes a lightweight public health check", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

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



test("applies an authenticated per-user burst limit to AI routes", async () => {
  const { app } = fixture();
  await withServer(app, async (base) => {
    const request = () => fetch(`${base}/v1/unknown`, {
      headers: { authorization: "Bearer valid-token" },
    });
    for (let count = 0; count < 30; count += 1) {
      const response = await request();
      assert.equal(response.status, 404, `request ${count + 1} should reach the route`);
    }
    const limited = await request();
    assert.equal(limited.status, 429);
    assert.match((await limited.json()).error, /Too many AI requests/);
  });
});

test("rejects a revoked or invalid Firebase ID token", async () => {
  const { app } = fixture({ tokenValid: false });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/writeups/draft`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ eventId: "event-1", notes: "We covered cloud computing basics and IAM." }),
    });
    assert.equal(response.status, 401);
  });
});

test("rejects a lead attempting to use AI on another author's writeup", async () => {
  const { app } = fixture({
    writeup: { authorId: "another-user", trackId: "cloud", eventId: "event-1" },
  });
  await withServer(app, async (base) => {
    const response = await fetch(`${base}/v1/writeups/draft`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ eventId: "event-1", writeupId: "writeup-1", notes: "We covered cloud computing basics and IAM." }),
    });
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /own writeups/);
  });
});

test("enforces the per-user hourly draft quota before calling Gemini", async () => {
  const { app, usage } = fixture();
  await withServer(app, async (base) => {
    const request = () => fetch(`${base}/v1/writeups/draft`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
      body: JSON.stringify({ eventId: "event-1", notes: "We covered cloud computing basics, IAM and least privilege." }),
    });
    for (let count = 0; count < 20; count += 1) {
      const response = await request();
      assert.equal(response.status, 200, `request ${count + 1} should be within quota`);
    }
    const limited = await request();
    assert.equal(limited.status, 429);
    assert.match((await limited.json()).error, /hourly AI limit/);
    assert.equal(usage["lead-1_draft"].count, 20);
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


test("retries a transient Gemini 503 once and succeeds without repeating quota consumption", async () => {
  let calls = 0;
  const delays = [];
  const genAI = { models: { async generateContent() {
    calls += 1;
    if (calls === 1) {
      const error = new Error("The model is overloaded");
      error.status = 503;
      throw error;
    }
    return { text: "ok" };
  } } };
  const response = await generateWithRetry(genAI, {}, {
    sleep: async (delay) => delays.push(delay),
    random: () => 0,
  });
  assert.equal(response.text, "ok");
  assert.equal(calls, 2);
  assert.deepEqual(delays, [1_000]);
});

test("stops after two retries for repeated Gemini 503 responses", async () => {
  let calls = 0;
  const delays = [];
  const genAI = { models: { async generateContent() {
    calls += 1;
    const error = new Error("Service unavailable");
    error.status = 503;
    throw error;
  } } };
  await assert.rejects(
    generateWithRetry(genAI, {}, {
      sleep: async (delay) => delays.push(delay),
      random: () => 0,
    }),
    (error) => error.status === 503
      && error.code === "GEMINI_UNAVAILABLE"
      && /temporarily busy/.test(error.message),
  );
  assert.equal(calls, 3);
  assert.deepEqual(delays, [1_000, 2_000]);
});

test("retries a temporary Gemini 429 rate limit", async () => {
  let calls = 0;
  const genAI = { models: { async generateContent() {
    calls += 1;
    if (calls === 1) {
      const error = new Error("Rate limit exceeded: requests per minute");
      error.status = 429;
      throw error;
    }
    return { text: "ok" };
  } } };
  const response = await generateWithRetry(genAI, {}, {
    sleep: async () => {},
    random: () => 0,
  });
  assert.equal(response.text, "ok");
  assert.equal(calls, 2);
});

test("does not retry an exhausted Gemini quota", async () => {
  let calls = 0;
  const genAI = { models: { async generateContent() {
    calls += 1;
    const error = new Error("Quota exceeded for requests per day");
    error.status = 429;
    throw error;
  } } };
  await assert.rejects(
    generateWithRetry(genAI, {}),
    (error) => error.status === 429
      && error.code === "GEMINI_QUOTA_EXHAUSTED"
      && /quota is currently exhausted/.test(error.message),
  );
  assert.equal(calls, 1);
});

test("does not retry permanent Gemini request errors", async () => {
  let calls = 0;
  const genAI = { models: { async generateContent() {
    calls += 1;
    const error = new Error("Invalid request");
    error.status = 400;
    throw error;
  } } };
  await assert.rejects(generateWithRetry(genAI, {}), /Invalid request/);
  assert.equal(calls, 1);
});


test("classifies an SDK RESOURCE_EXHAUSTED error as quota exhaustion", async () => {
  let calls = 0;
  const genAI = { models: { async generateContent() {
    calls += 1;
    const error = new Error("Resource exhausted");
    error.status = 429;
    error.code = "RESOURCE_EXHAUSTED";
    throw error;
  } } };
  await assert.rejects(
    generateWithRetry(genAI, {}),
    (error) => error.code === "GEMINI_QUOTA_EXHAUSTED",
  );
  assert.equal(calls, 1);
});

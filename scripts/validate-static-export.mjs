import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";

const outputDir = resolve("out");
const requiredRoutes = [
  "index.html",
  "leads.html",
  "lead.html",
  "gallery.html",
  "events.html",
  "event.html",
  "tracks.html",
  "track.html",
  "writeups.html",
  "writeup.html",
  "blog.html",
  "labs.html",
  "login.html",
  "admin.html",
  "dashboard.html",
];

function fail(message) {
  console.error(`::error::${message}`);
  process.exitCode = 1;
}

if (!existsSync(outputDir) || !statSync(outputDir).isDirectory()) {
  fail("Next.js static export directory out/ does not exist.");
  process.exit();
}

for (const route of requiredRoutes) {
  const file = resolve(outputDir, route);
  if (!existsSync(file) || !statSync(file).isFile() || statSync(file).size === 0) {
    fail(`Expected static route is missing or empty: out/${route}`);
  }
}

const hosting = JSON.parse(readFileSync("firebase.json", "utf8")).hosting;
if (hosting?.public !== "out") {
  fail(`Firebase Hosting must publish the validated out/ directory (found: ${hosting?.public ?? "unset"}).`);
}

const indexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
if (!Array.isArray(indexes.indexes) || !Array.isArray(indexes.fieldOverrides)) {
  fail("firestore.indexes.json must contain indexes and fieldOverrides arrays.");
} else {
  const seen = new Set();
  for (const index of indexes.indexes) {
    if (!index.collectionGroup || !["COLLECTION", "COLLECTION_GROUP"].includes(index.queryScope) || !Array.isArray(index.fields) || index.fields.length === 0) {
      fail(`Invalid Firestore composite index: ${JSON.stringify(index)}`);
      continue;
    }
    const key = JSON.stringify([index.collectionGroup, index.queryScope, index.fields]);
    if (seen.has(key)) fail(`Duplicate Firestore composite index: ${index.collectionGroup}`);
    seen.add(key);
    for (const field of index.fields) {
      if (!field.fieldPath || !["ASCENDING", "DESCENDING", "ARRAY_CONTAINS", "VECTOR"].includes(field.order ?? field.arrayConfig ?? field.vectorConfig)) {
        fail(`Invalid Firestore index field in ${index.collectionGroup}: ${JSON.stringify(field)}`);
      }
    }
  }
}

const localAssets = new Set();
for (const route of requiredRoutes) {
  const file = resolve(outputDir, route);
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:src|href)=(["'])(\/_next\/[^"'?#]+)\1/g)) {
    localAssets.add(match[2]);
  }
}

for (const assetUrl of localAssets) {
  const assetPath = resolve(outputDir, assetUrl.replace(/^\//, ""));
  if (!assetPath.startsWith(outputDir + sep) || !existsSync(assetPath) || !statSync(assetPath).isFile()) {
    fail(`Static asset referenced by exported HTML is missing: ${assetUrl}`);
  }
}

if (process.exitCode) {
  console.error("Static export validation failed.");
} else {
  console.log(`Static export validation passed: ${requiredRoutes.length} routes, ${localAssets.size} referenced Next.js assets, Firebase Hosting target and Firestore index structure.`);
}

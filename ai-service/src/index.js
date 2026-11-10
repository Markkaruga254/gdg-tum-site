import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";
import { createApp } from "./server.js";

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT is required.");
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY must be configured as a server-side secret.");

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount;
if (serviceAccountJson) {
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must contain valid service-account JSON.");
  }
  if (serviceAccount.project_id !== projectId) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT project_id does not match GOOGLE_CLOUD_PROJECT.");
  }
}
const firebaseApp = getApps()[0] || initializeApp({
  projectId,
  ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
});
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  // The application retry wrapper owns retry policy so SDK retries cannot multiply attempts.
  httpOptions: { retryOptions: { attempts: 1 } },
});

const app = createApp({
  auth,
  db,
  genAI,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "https://gdg-tum-site.web.app,https://gdg-tum-site.firebaseapp.com")
    .split(",").map((origin) => origin.trim()).filter(Boolean),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
});

const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () => {
  console.log(`Writeup AI service listening on port ${port}`);
});

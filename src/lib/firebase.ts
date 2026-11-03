import { initializeApp, getApps } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// NEXT_PUBLIC_* values are inlined at build time, so a production bundle cannot
// carry an emulator target. A bad value must fail loudly instead of falling
// back to the production project the rest of firebaseConfig points at.
const emulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
if (emulatorHost !== undefined) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST is set but this is a production build; unset it.",
    );
  }
  const [host = "", port = ""] = emulatorHost.split(":");
  if (host === "" || !/^\d+$/.test(port)) {
    throw new Error(
      `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST must be "host:port" (or unset to use the real project), got "${emulatorHost}".`,
    );
  }
  // The emulator stores each project id in its own namespace, so an app still
  // pointing at the real project id would silently see an empty database.
  if (!firebaseConfig.projectId?.startsWith("demo-")) {
    throw new Error(
      `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST is set, so NEXT_PUBLIC_FIREBASE_PROJECT_ID must be the emulator's demo project, got "${firebaseConfig.projectId}".`,
    );
  }
  connectFirestoreEmulator(db, host, Number(port));
}

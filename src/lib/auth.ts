import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";
import { app } from "./firebase";
import { deleteField, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const auth = getAuth(app);

const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
if (authEmulatorHost !== undefined) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST is set but this is a production build; unset it.",
    );
  }
  const [host = "", port = ""] = authEmulatorHost.split(":");
  if (host === "" || !/^\d+$/.test(port) || !app.options.projectId?.startsWith("demo-")) {
    throw new Error(
      'Auth emulator requires a demo project and NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST in "host:port" format.',
    );
  }
  connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
}

const STAFF_ACCESS_REQUIRED =
  "This Google account is not provisioned as a GDG TUM Track Lead or Admin. Contact a GDG TUM administrator if you need access.";

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const u = res.user;

  try {
    const userRef = doc(db, "users", u.uid);
    const snap = await getDoc(userRef);

    // Staff profiles are provisioned by an administrator before sign-in.
    // Never create member profiles as a side effect of visiting the login page.
    if (!snap.exists()) {
      throw new Error(STAFF_ACCESS_REQUIRED);
    }

    const profile = snap.data();
    const isAdmin = profile.role === "admin";
    const isLead = profile.role === "lead" && typeof profile.track === "string" && profile.track.trim() !== "";
    if (!isAdmin && !isLead) {
      throw new Error(STAFF_ACCESS_REQUIRED);
    }

    // Keep the email private for authorized staff only. Merge so other
    // private account fields are preserved.
    await setDoc(doc(db, "private_users", u.uid), { email: u.email || "" }, { merge: true });

    // Migrate a legacy public email field the next time its owner signs in.
    if (Object.prototype.hasOwnProperty.call(profile, "email")) {
      await updateDoc(userRef, { email: deleteField() });
    }

    return u;
  } catch (error) {
    // A Google identity that fails authorization (or profile loading) must not
    // remain authenticated in the public browsing session.
    try {
      await fbSignOut(auth);
    } catch {
      // Preserve the original authorization/profile error for the login UI.
    }
    throw error;
  }
}

export async function signInE2E(email: string, password: string) {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_E2E_AUTH_ENABLED !== "true") {
    throw new Error("E2E authentication is only available in the local test environment.");
  }
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  await fbSignOut(auth);
}

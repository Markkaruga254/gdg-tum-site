import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { app } from "./firebase";
import { deleteField, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const auth = getAuth(app);

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const u = res.user;
  const userRef = doc(db, "users", u.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, { name: u.displayName || "", photoUrl: u.photoURL || "", role: "member", track: null });
  }

  // Keep the email private for both new and existing profiles. Merge so other
  // private account fields are preserved.
  await setDoc(doc(db, "private_users", u.uid), { email: u.email || "" }, { merge: true });

  // Migrate a legacy public email field the next time its owner signs in.
  if (snap.exists() && Object.prototype.hasOwnProperty.call(snap.data(), "email")) {
    await updateDoc(userRef, { email: deleteField() });
  }

  return res.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { app } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const auth = getAuth(app);

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const u = res.user;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { name: u.displayName || "", photoUrl: u.photoURL || "", role: "member", track: null });
    await setDoc(doc(db, "private_users", u.uid), { email: u.email || "" });
  }
  return res.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

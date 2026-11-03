"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setAllowed(false); setLoading(false); return; }
      setUid(u.uid);
      const snap = await getDoc(doc(db, "users", u.uid));
      const ok = snap.exists() && snap.data().role === "admin";
      setAllowed(ok);
      if (ok) {
        const s = await getDocs(collection(db, "users"));
        setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function saveUser(u: any, newRole: string, newTrack: string) {
    setMsg(""); setErr("");
    if (u.id === uid && newRole !== "admin") { setErr("Cannot remove your own admin role"); return; }
    try {
      await updateDoc(doc(db, "users", u.id), { role: newRole, track: newTrack || null });
      setMsg("Saved");
      const s = await getDocs(collection(db, "users"));
      setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e: any) { setErr(e?.message || "Save failed"); }
  }

  if (loading) return <><Nav /><main className="p-6">Loading…</main><Footer /></>;
  if (!allowed) return <><Nav /><main className="p-6">Not allowed.</main><Footer /></>;
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <h1 className="font-display text-4xl uppercase">Admin</h1>
        {msg && <p className="mt-2 text-sm text-green">{msg}</p>}
        {err && <p className="mt-2 text-sm text-red">{err}</p>}
        {users.length === 0 && <p className="mt-4">No users.</p>}
        <div className="mt-4 grid gap-3">
          {users.map((u) => (
            <UserRow key={u.id} u={u} self={u.id === uid} onSave={saveUser} />
          ))}
        </div>
      </main><Footer />
    </>
  );
}

function UserRow({ u, self, onSave }: any) {
  const [role, setRole] = useState(u.role);
  const [track, setTrack] = useState(u.track || "");
  return (
    <div className="border-[3px] border-ink p-3 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
      <div>{u.name} {self && "(you)"}</div>
      <select value={role} onChange={(e) => setRole(e.target.value)} className="border-[3px] border-ink px-2 py-1">
        <option value="member">member</option><option value="lead">lead</option><option value="admin">admin</option>
      </select>
      <select value={track} onChange={(e) => setTrack(e.target.value)} className="border-[3px] border-ink px-2 py-1">
        <option value="">none</option><option value="cloud">cloud</option><option value="cybersecurity">cybersecurity</option><option value="web">web</option><option value="women-in-tech">women-in-tech</option>
      </select>
      <button onClick={() => onSave(u, role, track)} className="border-[3px] border-ink bg-ink px-3 py-1 font-bold uppercase text-white">Save</button>
    </div>
  );
}

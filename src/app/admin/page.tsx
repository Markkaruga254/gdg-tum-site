"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";

const trackOptions = [
  { value: "", label: "None" },
  { value: "cloud", label: "Cloud" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "web", label: "Web" },
  { value: "women-in-tech", label: "Women in Tech" },
];

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setAllowed(false);
          setLoading(false);
          return;
        }
        setUid(user.uid);
        const snap = await getDoc(doc(db, "users", user.uid));
        const isAdmin = snap.exists() && snap.data().role === "admin";
        setAllowed(isAdmin);
        if (isAdmin) {
          const result = await getDocs(collection(db, "users"));
          setUsers(result.docs.map((item) => ({ id: item.id, ...item.data() })));
        }
      } catch {
        setErr("Admin data could not be loaded.");
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function refreshUsers() {
    const result = await getDocs(collection(db, "users"));
    setUsers(result.docs.map((item) => ({ id: item.id, ...item.data() })));
  }

  async function saveUser(user: any, newRole: string, newTrack: string) {
    setMsg("");
    setErr("");
    if (user.id === uid && newRole !== "admin") {
      setErr("You cannot remove your own admin role.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.id), { role: newRole, track: newTrack || null });
      await refreshUsers();
      setMsg("Changes saved.");
    } catch (error: any) {
      setErr(error?.message || "Changes could not be saved.");
    }
  }

  if (loading) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading admin…</main><Footer /></>;
  if (!allowed) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[56px] uppercase">Not allowed</h1><p className="mt-[10px] text-[14px]">This page is available to administrators only.</p></main><Footer /></>;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Admin</h1>
          <p className="mt-[14px] max-w-[600px] text-[17px] leading-[1.5]">Manage who can post, and on which track.</p>
        </header>

        {msg && <p role="status" className="border-b-[3px] border-ink bg-green px-[26px] py-[12px] text-[13px] font-bold">{msg}</p>}
        {err && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[12px] text-[13px] font-bold">{err}</p>}

        <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-[14px] border-b-[3px] border-ink bg-ink px-[26px] py-[14px] text-[11px] font-bold uppercase text-white sm:grid">
          <span>Name</span><span>Role</span><span>Track</span><span className="w-[86px]">Action</span>
        </div>

        {users.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[22px] text-[13px] font-bold uppercase">No users found.</p>
        ) : users.map((user) => (
          <UserRow key={user.id} user={user} self={user.id === uid} onSave={saveUser} />
        ))}

        <p className="border-b-[3px] border-ink px-[26px] py-[18px] text-[12px] leading-[1.6]">
          You cannot remove your own admin role. Changes save per row.
        </p>
      </main>
      <Footer />
    </>
  );
}

function UserRow({ user, self, onSave }: any) {
  const [role, setRole] = useState(user.role || "member");
  const [track, setTrack] = useState(user.track || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(user, role, track);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-center gap-[12px] border-b-[3px] border-ink px-[26px] py-[16px] sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:gap-[14px]">
      <div className="font-bold">{user.name || "Unnamed user"} {self && <span className="ml-[6px] text-[11px] font-bold uppercase">(you)</span>}</div>
      <label className="grid gap-[5px] text-[10px] font-bold uppercase sm:block">
        <span className="sm:hidden">Role</span>
        <select value={role} onChange={(event) => setRole(event.target.value)} className="w-full border-[3px] border-ink bg-white px-[9px] py-[8px] text-[13px]">
          <option value="member">Member</option>
          <option value="lead">Lead</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label className="grid gap-[5px] text-[10px] font-bold uppercase sm:block">
        <span className="sm:hidden">Track</span>
        <select value={track} onChange={(event) => setTrack(event.target.value)} className="w-full border-[3px] border-ink bg-white px-[9px] py-[8px] text-[13px]">
          {trackOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <Button variant="outline" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
    </div>
  );
}

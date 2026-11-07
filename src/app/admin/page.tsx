"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, updateDoc, setDoc } from "firebase/firestore";

const trackOptions = [
  { value: "", label: "None" },
  { value: "cloud", label: "Cloud" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "web", label: "Web" },
  { value: "women-in-tech", label: "Women in Tech" },
];

const trackColorOptions = [
  { value: "blue", label: "Blue (Cloud)" },
  { value: "red", label: "Red (Cybersecurity)" },
  { value: "green", label: "Green (Web)" },
  { value: "yellow", label: "Yellow (Women in Tech)" },
];

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"users" | "tracks">("users");
  const [trackForm, setTrackForm] = useState<any>({ slug: "", name: "", color: "blue", description: "", leadIds: "" });
  const [savingTrack, setSavingTrack] = useState(false);

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
          await refreshUsers();
          await refreshTracks();
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

  async function refreshTracks() {
    const result = await getDocs(collection(db, "tracks"));
    setTracks(result.docs.map((item) => ({ id: item.id, ...item.data() })));
  }

  async function saveUser(user: any, payload: any) {
    setMsg("");
    setErr("");
    if (user.id === uid && payload.role !== "admin") {
      setErr("You cannot remove your own admin role.");
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.id), payload);
      await refreshUsers();
      setMsg("Changes saved.");
    } catch (error: any) {
      setErr(error?.message || "Changes could not be saved.");
    }
  }

  async function saveTrack() {
    setMsg("");
    setErr("");
    if (!trackForm.slug || !trackForm.name) {
      setErr("Track slug and name are required.");
      return;
    }
    setSavingTrack(true);
    try {
      await setDoc(doc(db, "tracks", trackForm.slug), {
        name: trackForm.name,
        slug: trackForm.slug,
        color: trackForm.color,
        description: trackForm.description,
        leadIds: trackForm.leadIds ? trackForm.leadIds.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      }, { merge: true });
      await refreshTracks();
      setMsg("Track saved.");
    } catch (error: any) {
      setErr(error?.message || "Track could not be saved.");
    } finally {
      setSavingTrack(false);
    }
  }

  function editTrack(track: any) {
    setTrackForm({
      slug: track.slug || track.id,
      name: track.name || "",
      color: track.color || "blue",
      description: track.description || "",
      leadIds: Array.isArray(track.leadIds) ? track.leadIds.join(", ") : "",
    });
  }

  if (loading) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading admin…</main><Footer /></>;
  if (!allowed) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[56px] uppercase">Not allowed</h1><p className="mt-[10px] text-[14px]">This page is available to administrators only.</p></main><Footer /></>;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Admin</h1>
          <p className="mt-[14px] max-w-[600px] text-[17px] leading-[1.5]">Manage who can post, on which track, and track content.</p>
        </header>

        <div className="flex border-b-[3px] border-ink">
          <button type="button" onClick={() => setTab("users")} className={`px-[22px] py-[16px] text-[12px] font-bold uppercase ${tab === "users" ? "bg-yellow" : "bg-white"}`}>Users</button>
          <button type="button" onClick={() => setTab("tracks")} className={`border-l-[3px] border-ink px-[22px] py-[16px] text-[12px] font-bold uppercase ${tab === "tracks" ? "bg-yellow" : "bg-white"}`}>Tracks</button>
        </div>

        {msg && <p role="status" className="border-b-[3px] border-ink bg-green px-[26px] py-[12px] text-[13px] font-bold">{msg}</p>}
        {err && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[12px] text-[13px] font-bold">{err}</p>}

        {tab === "users" && (
          <>
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-[14px] border-b-[3px] border-ink bg-ink px-[26px] py-[14px] text-[11px] font-bold uppercase text-white sm:grid">
              <span>Name</span><span>Role</span><span>Track</span><span aria-hidden="true" className="w-[86px]" />
            </div>
            {users.length === 0 ? (
              <p className="border-b-[3px] border-ink px-[26px] py-[22px] text-[13px] font-bold uppercase">No users found.</p>
            ) : users.map((user) => (
              <UserRow key={user.id} user={user} self={user.id === uid} onSave={saveUser} />
            ))}
            <p className="border-b-[3px] border-ink px-[26px] py-[18px] text-[12px] leading-[1.6]">
              You cannot remove your own admin role. Changes save per row.
            </p>
          </>
        )}

        {tab === "tracks" && (
          <div className="grid grid-cols-1 gap-[24px] px-[26px] py-[26px] lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="font-display text-[34px] uppercase">Tracks</h2>
              <div className="mt-[12px] grid gap-[10px]">
                {tracks.map((track) => (
                  <button key={track.id} type="button" onClick={() => editTrack(track)} className="border-[3px] border-ink px-[16px] py-[12px] text-left text-[13px] font-bold uppercase hover:bg-yellow">
                    {track.name || track.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-[3px] border-ink p-[18px]">
              <h2 className="font-display text-[28px] uppercase">Edit track</h2>
              <label className="mt-[12px] block text-[10px] font-bold uppercase">Slug</label>
              <input value={trackForm.slug} onChange={(e) => setTrackForm({ ...trackForm, slug: e.target.value })} className="mt-[6px] w-full border-[3px] border-ink px-[12px] py-[10px] text-[14px]" />
              <label className="mt-[12px] block text-[10px] font-bold uppercase">Name</label>
              <input value={trackForm.name} onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value })} className="mt-[6px] w-full border-[3px] border-ink px-[12px] py-[10px] text-[14px]" />
              <label className="mt-[12px] block text-[10px] font-bold uppercase">Color</label>
              <select value={trackForm.color} onChange={(e) => setTrackForm({ ...trackForm, color: e.target.value })} className="mt-[6px] w-full border-[3px] border-ink px-[12px] py-[10px] text-[14px]">
                {trackColorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label className="mt-[12px] block text-[10px] font-bold uppercase">Description</label>
              <textarea value={trackForm.description} onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })} rows={4} className="mt-[6px] w-full border-[3px] border-ink px-[12px] py-[10px] text-[14px]" />
              <label className="mt-[12px] block text-[10px] font-bold uppercase">Lead IDs (comma separated)</label>
              <input value={trackForm.leadIds} onChange={(e) => setTrackForm({ ...trackForm, leadIds: e.target.value })} className="mt-[6px] w-full border-[3px] border-ink px-[12px] py-[10px] text-[14px]" />
              <div className="mt-[16px]">
                <Button variant="outline" onClick={() => void saveTrack()} disabled={savingTrack}>{savingTrack ? "Saving…" : "Save track"}</Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function UserRow({ user, self, onSave }: any) {
  const [role, setRole] = useState(user.role || "member");
  const [track, setTrack] = useState(user.track || "");
  const [bio, setBio] = useState(user.bio || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(user, { role, track: track || null, bio, photoUrl });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-[12px] border-b-[3px] border-ink px-[26px] py-[16px] sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:gap-[14px]">
      <div>
        <div className="font-bold">{user.name || "Unnamed user"} {self && <span className="ml-[6px] text-[11px] font-bold uppercase">(you)</span>}</div>
        <label className="mt-[8px] block text-[10px] font-bold uppercase">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="mt-[4px] w-full border-[3px] border-ink px-[9px] py-[6px] text-[13px]" />
        <label className="mt-[8px] block text-[10px] font-bold uppercase">Photo URL</label>
        <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="mt-[4px] w-full border-[3px] border-ink px-[9px] py-[6px] text-[13px]" />
      </div>
      <label className="grid gap-[5px] text-[10px] font-bold uppercase sm:block">
        <span className="sm:hidden">Role</span>
        <select value={role} disabled={self} onChange={(event) => setRole(event.target.value)} className="w-full border-[3px] border-ink bg-white px-[9px] py-[8px] text-[13px] disabled:bg-[#f5f5f5]">
          {self ? <option value="admin">Admin</option> : <>
            <option value="member">Member</option>
            <option value="lead">Lead</option>
            <option value="admin">Admin</option>
          </>}
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

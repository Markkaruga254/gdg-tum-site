"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";

const trackOptions = [
  { value: "", label: "None" },
  { value: "cloud", label: "Cloud" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "web", label: "Web" },
  { value: "women-in-tech", label: "Women in Tech" },
];

const roleOrder: Record<string, number> = { admin: 0, lead: 1, member: 2 };

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          if (active) {
            setAllowed(false);
            setLoading(false);
          }
          return;
        }

        if (active) setUid(user.uid);
        const snap = await getDoc(doc(db, "users", user.uid));
        const isAdmin = snap.exists() && snap.data().role === "admin";
        if (!active) return;

        setAllowed(isAdmin);
        if (isAdmin) await refreshUsers(user.uid);
      } catch {
        if (active) {
          setErr("Admin data could not be loaded.");
          setAllowed(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  async function refreshUsers(selfUid?: string) {
    const result = await getDocs(collection(db, "users"));
    const nextUsers: any[] = result.docs.map((item) => ({ id: item.id, ...item.data() }));
    nextUsers.sort((a, b) => {
      if (a.id === selfUid) return -1;
      if (b.id === selfUid) return 1;
      const roleDifference = (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
      return roleDifference || String(a.name || "").localeCompare(String(b.name || ""));
    });
    setUsers(nextUsers);
  }

  async function saveUser(user: any, payload: { role: string; track: string }) {
    setMsg("");
    setErr("");

    if (user.id === uid && payload.role !== "admin") {
      setErr("You cannot remove your own admin role.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.id), {
        role: payload.role,
        track: payload.track || null,
      });
      await refreshUsers(uid ?? undefined);
      setMsg("Changes saved.");
    } catch (error: any) {
      setErr(error?.message || "Changes could not be saved.");
    }
  }

  async function saveUserPhoto(user: any, photoUrl: string) {
    setMsg("");
    setErr("");
    try {
      await updateDoc(doc(db, "users", user.id), { photoUrl });
      await refreshUsers(uid ?? undefined);
      setMsg(`Profile photo saved for ${user.name || "track lead"}.`);
    } catch (error: any) {
      setErr(error?.message || "The profile photo could not be saved.");
      throw error;
    }
  }

  if (loading) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading admin…</main>
        <Footer />
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">
          <h1 className="font-display text-[56px] uppercase">Not allowed</h1>
          <p className="mt-[10px] text-[14px]">This page is available to administrators only.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Admin</h1>
          <p className="mt-[14px] max-w-[600px] text-[17px] leading-[1.5]">
            Manage who can post, and on which track.
          </p>
        </header>

        {msg && (
          <p role="status" className="border-b-[3px] border-ink bg-green px-[26px] py-[12px] text-[13px] font-bold">
            {msg}
          </p>
        )}
        {err && (
          <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[12px] text-[13px] font-bold">
            {err}
          </p>
        )}

        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-[6px] border-b-[3px] border-ink bg-ink px-[12px] py-[10px] text-[9px] font-bold uppercase text-white sm:gap-[14px] sm:px-[26px] sm:py-[12px] sm:text-[11px]">
          <span>Name</span>
          <span>Role</span>
          <span>Track</span>
          <span aria-hidden="true" className="w-[42px] sm:w-[76px]" />
        </div>

        {users.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[22px] text-[13px] font-bold uppercase">
            No users found.
          </p>
        ) : (
          users.map((user) => (
            <UserRow key={user.id} user={user} self={user.id === uid} onSave={saveUser} onSavePhoto={saveUserPhoto} />
          ))
        )}

        <p className="border-b-[3px] border-ink px-[12px] py-[14px] text-[11px] leading-[1.5] sm:px-[26px] sm:py-[16px] sm:text-[13px]">
          You cannot remove your own admin role. Changes save per row.
        </p>
      </main>
      <Footer />
    </>
  );
}

function UserRow({ user, self, onSave, onSavePhoto }: any) {
  const [role, setRole] = useState(user.role || "member");
  const [track, setTrack] = useState(user.track || "");
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Choose a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("The image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, undefined, "profile", user.id);
      setPreviewUrl(uploaded.url);
    } catch (error: any) {
      setPhotoError(error?.message || "The profile photo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function savePhoto() {
    if (!previewUrl) return;
    setSavingPhoto(true);
    setPhotoError("");
    try {
      await onSavePhoto(user, previewUrl);
      setPreviewUrl("");
    } catch (error: any) {
      setPhotoError(error?.message || "The profile photo could not be saved.");
    } finally {
      setSavingPhoto(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(user, { role, track });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="admin-user-row"
      className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-[6px] border-b-[3px] border-ink px-[12px] py-[10px] sm:gap-[14px] sm:px-[26px] sm:py-[14px]"
    >
      <div className="min-w-0 break-words text-[10px] font-bold sm:text-[14px]">
        {user.name || "Unnamed user"}{" "}
        {self && <span className="ml-[3px] text-[8px] font-bold uppercase sm:ml-[6px] sm:text-[11px]">(you)</span>}
      </div>

      <select
        aria-label={`Role for ${user.name || user.id}`}
        value={role}
        disabled={self}
        onChange={(event) => setRole(event.target.value)}
        className="min-w-0 w-full border-[3px] border-ink bg-white px-[4px] py-[7px] text-[9px] disabled:bg-[#f5f5f5] sm:px-[9px] sm:py-[8px] sm:text-[13px]"
      >
        {self ? (
          <option value="admin">Admin</option>
        ) : (
          <>
            <option value="member">Member</option>
            <option value="lead">Lead</option>
            <option value="admin">Admin</option>
          </>
        )}
      </select>

      <select
        aria-label={`Track for ${user.name || user.id}`}
        value={track}
        onChange={(event) => setTrack(event.target.value)}
        className="min-w-0 w-full border-[3px] border-ink bg-white px-[4px] py-[7px] text-[9px] sm:px-[9px] sm:py-[8px] sm:text-[13px]"
      >
        {trackOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="min-w-[42px] border-[3px] border-ink px-[5px] py-[8px] text-[9px] font-bold uppercase disabled:opacity-60 sm:min-w-[76px] sm:px-[16px] sm:text-[11px]"
      >
        {saving ? "…" : "Save"}
      </button>
      {user.role === "lead" && (
        <section className="col-span-full flex flex-wrap items-center gap-[12px] border-t border-ink/20 pt-[12px]" aria-label={`Profile photo for ${user.name || user.id}`}>
          <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden border-[2px] border-ink bg-[#f5f5f5]">
            {(previewUrl || user.photoUrl) ? (
              <Image src={previewUrl || user.photoUrl} alt={`${user.name || "Track lead"} profile preview`} width={64} height={64} unoptimized className="h-full w-full object-cover" />
            ) : (
              <span className="px-[4px] text-center text-[9px] font-bold uppercase">No photo</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase">Track lead photo</p>
            <p className="mt-[3px] text-[10px] text-[#555]">{previewUrl ? "New photo uploaded — save to publish it on the profile." : user.photoUrl ? "Current profile photo" : "No profile photo added yet."}</p>
            {photoError && <p role="alert" className="mt-[5px] text-[11px] font-bold text-red-700">{photoError}</p>}
          </div>
          <label className="cursor-pointer border-[2px] border-ink px-[10px] py-[8px] text-[10px] font-bold uppercase">
            {uploading ? "Uploading…" : user.photoUrl || previewUrl ? "Choose / replace" : "Choose photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void choosePhoto(event)}
              disabled={uploading || savingPhoto}
              className="sr-only"
              aria-label={`Choose profile photo for ${user.name || user.id}`}
            />
          </label>
          {previewUrl && (
            <>
              <button type="button" onClick={() => setPreviewUrl("")} disabled={savingPhoto} className="border-[2px] border-ink px-[10px] py-[8px] text-[10px] font-bold uppercase disabled:opacity-60">Cancel</button>
              <button type="button" onClick={() => void savePhoto()} disabled={savingPhoto} className="border-[2px] border-ink bg-ink px-[10px] py-[8px] text-[10px] font-bold uppercase text-white disabled:opacity-60">
                {savingPhoto ? "Saving…" : "Save photo"}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}

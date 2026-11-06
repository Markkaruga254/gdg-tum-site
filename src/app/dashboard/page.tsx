"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import {
  validateEvent as validateEventSchema,
  type EventForm,
  validateWriteup as validateWriteupSchema,
} from "@/lib/validators";
import PartnersTab from "./PartnersTab";
import OverviewTab from "./OverviewTab";
import MyEventsTab from "./MyEventsTab";
import NewWriteupTab from "./NewWriteupTab";
import MediaTab from "./MediaTab";
import LiveTickerTab from "./LiveTickerTab";
import MyProfileTab from "./MyProfileTab";
import { getUserById, getEvents, getWriteups, getMediaByWriteup } from "@/lib/data";
import type { TrackSlug } from "@/lib/types";

const TABS = ["Overview","New writeup","My events","Media","Live ticker","My profile","Partners"];

export default function DashboardPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [track, setTrack] = useState<string>("");
  const [tab, setTab] = useState("New writeup");
  const [events, setEvents] = useState<any[]>([]);
  const [writeups, setWriteups] = useState<any[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // event form state
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({ title: "", date: "", venue: "", status: "upcoming", attendance: "", trackId: "" });
  const [eventErrors, setEventErrors] = useState<any>({});

  // writeup form state
  const [editingWriteup, setEditingWriteup] = useState<any | null>(null);
  const [wf, setWf] = useState({ eventId: "", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }] });
  const [wfErrors, setWfErrors] = useState<any>({});
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [preview, setPreview] = useState(true);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiPhotoIds, setAiPhotoIds] = useState<string[]>([]);
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setAllowed(false); return; }
      const userData = await getUserById(u.uid);
      const r = userData?.role ?? "member";
      const ok = r === "lead" || r === "admin";
      setAllowed(ok);
      if (ok) { setUid(u.uid); setRole(r); setTrack(userData?.track ?? ""); }
    });
    return () => unsub();
  }, []);

  async function loadEvents() {
    try {
      const fetched = role === "lead" && track ? await getEvents({ trackId: track as TrackSlug }) : await getEvents();
      setEvents(fetched as any[]);
    } catch {
      setEvents([]);
    }
  }
  async function loadWriteups() {
    if (!uid) return;
    const fetched = await getWriteups({ authorId: uid });
    setWriteups(fetched as any[]);
  }
  async function loadMedia(wid: string) {
    const fetched = await getMediaByWriteup(wid);
    setMediaList(fetched as any[]);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (allowed && uid) { loadEvents(); loadWriteups(); } }, [allowed, uid, role, track]);

  function validateEvent() {
    const errors = validateEventSchema(eventForm, role);
    setEventErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function saveEvent() {
    setErr(""); setMsg("");
    if (!validateEvent()) return;
    setSaving(true);
    try {
      const data: any = {
        title: eventForm.title, venue: eventForm.venue, status: eventForm.status,
        trackId: role === "admin" ? eventForm.trackId : track,
        date: Timestamp.fromDate(new Date(eventForm.date)),
        attendance: eventForm.attendance ? Number(eventForm.attendance) : null,
      };
      if (editingEvent) await updateDoc(doc(db, "events", editingEvent.id), data);
      else await addDoc(collection(db, "events"), data);
      setMsg(editingEvent ? "Event updated" : "Event created");
      setEditingEvent(null);
      setEventForm({ title: "", date: "", venue: "", status: "upcoming", attendance: "", trackId: "" });
      await loadEvents();
    } catch (e: any) { setErr(e?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event? Deletion is permanent and cannot be undone — cancelling keeps the record and can be reversed.")) return;
    try { await deleteDoc(doc(db, "events", id)); setMsg("Event deleted"); await loadEvents(); }
    catch (e: any) { setErr(e?.message || "Delete failed"); }
  }

  async function cancelEvent(id: string) {
    if (!confirm("Cancel this event? It leaves the public listings and can be restored later.")) return;
    try {
      await updateDoc(doc(db, "events", id), { status: "cancelled", cancelledAt: serverTimestamp(), cancelledBy: uid });
      setMsg("Event cancelled"); await loadEvents();
    }
    catch (e: any) { setErr(e?.message || "Cancel failed"); }
  }

  function startEditEvent(ev: any) {
    setEditingEvent(ev);
    const d = ev.date?.toDate ? ev.date.toDate() : new Date(ev.date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEventForm({ title: ev.title, date: local, venue: ev.venue, status: ev.status, attendance: ev.attendance ?? "", trackId: ev.trackId });
  }

  function validateWriteup(publish: boolean) {
    const errors = validateWriteupSchema(wf, publish);
    setWfErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function saveWriteup(publish: boolean) {
    setErr(""); setMsg("");
    if (!validateWriteup(publish)) return;
    setSaving(true);
    try {
      const ev = events.find((x) => x.id === wf.eventId);
      const data: any = {
        eventId: wf.eventId, trackId: ev?.trackId || track, authorId: uid,
        title: wf.title, summary: wf.summary, body: wf.body,
        attendance: wf.attendance ? Number(wf.attendance) : null,
        links: wf.links.filter((l: any) => l.url),
        tags: { topics: topicTags, products: productTags },
        aiDrafted: false,
      };
      if (publish) { data.status = "published"; data.publishedAt = serverTimestamp(); }
      else { data.status = "draft"; }
      let savedId = editingWriteup?.id;
      if (editingWriteup) {
        await updateDoc(doc(db, "writeups", editingWriteup.id), data);
      } else {
        const created = await addDoc(collection(db, "writeups"), data);
        savedId = created.id;
      }
      setMsg(publish ? "Published" : "Draft saved");
      if (savedId) {
        setEditingWriteup({ id: savedId, authorId: uid, trackId: data.trackId });
        await loadMedia(savedId);
      }
      await loadWriteups();
    } catch (e: any) { setErr(e?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function publishWriteup(id: string) {
    try { await updateDoc(doc(db, "writeups", id), { status: "published", publishedAt: serverTimestamp() }); setMsg("Published"); await loadWriteups(); }
    catch (e: any) { setErr(e?.code === "permission-denied" ? "You can only publish writeups in your own track." : e?.message || "Failed"); }
  }
  async function unpublish(id: string) {
    try { await updateDoc(doc(db, "writeups", id), { status: "draft" }); setMsg("Unpublished"); await loadWriteups(); }
    catch (e: any) { setErr(e?.code === "permission-denied" ? "You can only unpublish writeups in your own track." : e?.message || "Failed"); }
  }
  async function deleteWriteup(id: string) {
    if (!confirm("Delete this writeup?")) return;
    try { await deleteDoc(doc(db, "writeups", id)); setMsg("Deleted"); await loadWriteups(); }
    catch (e: any) { setErr(e?.message || "Failed"); }
  }
  function startEditWriteup(w: any) {
    setEditingWriteup(w);
    setWf({ eventId: w.eventId, title: w.title, summary: w.summary || "", body: w.body || "", attendance: w.attendance ?? "", links: w.links?.length ? w.links : [{ title: "", url: "" }] });
    setAiConsent(false);
    setAiPhotoIds([]);
    setTopicTags(w.tags?.topics || []);
    setProductTags(w.tags?.products || []);
    loadMedia(w.id);
  }

  if (allowed === null) return <><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading dashboard…</main></>;
  if (!allowed) return <><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[48px] uppercase">Not allowed</h1><p className="mt-2 text-sm">This dashboard is available to track leads and admins.</p></main></>;

  return (
    <>
      <header className="mx-auto flex max-w-[1280px] flex-wrap items-center border-b-[3px] border-ink">
        <Link href="/" className="border-r-[3px] border-ink px-[22px] py-[14px] font-display text-[30px] uppercase tracking-[1px]">GDG<span className="text-blue">.</span>TUM</Link>
        <span className="px-[20px] py-[16px] text-[12px] font-bold uppercase">Lead dashboard</span>
        <span className="ml-auto border-l-[3px] border-ink bg-blue px-[20px] py-[20px] text-[12px] font-bold uppercase text-white">{role === "admin" ? "Admin" : `${track.replaceAll("-", " ")} Track`}</span>
        <button type="button" onClick={() => void signOut()} className="border-l-[3px] border-ink px-[16px] py-[20px] text-[11px] font-bold uppercase">Sign out</button>
      </header>
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 border-x-[3px] border-ink md:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b-[3px] border-ink md:border-b-0 md:border-r-[3px]">
          {(TABS.filter((t) => {
            if (t === "Partners") return role === "admin";
            if (t === "Live ticker") return role === "admin" || role === "lead";
            return true;
          })).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? "page" : undefined} className={`block w-full border-b-[3px] border-ink px-[18px] py-[17px] text-left text-[11px] font-bold uppercase ${tab === t ? "bg-yellow" : "bg-white"}`}>{t}</button>
          ))}
        </aside>
        <main className="min-w-0 p-[20px] sm:p-[28px]">
          {msg && <p className="mb-2 text-sm text-green">{msg}</p>}
          {err && <p className="mb-2 text-sm text-red">{err}</p>}

          {tab === "Overview" && <OverviewTab events={events} writeups={writeups} setTab={setTab} />}

          {tab === "My events" && <MyEventsTab events={events} role={role} eventForm={eventForm} setEventForm={setEventForm} eventErrors={eventErrors} saveEvent={saveEvent} saving={saving} editingEvent={editingEvent} setEditingEvent={setEditingEvent} startEditEvent={startEditEvent} cancelEvent={cancelEvent} deleteEvent={deleteEvent} />}

          {tab === "New writeup" && <NewWriteupTab editingWriteup={editingWriteup} setEditingWriteup={setEditingWriteup} wf={wf} setWf={setWf} wfErrors={wfErrors} events={events} setMediaList={setMediaList} saveWriteup={saveWriteup} saving={saving} mediaList={mediaList} aiPhotoIds={aiPhotoIds} setAiPhotoIds={setAiPhotoIds} aiConsent={aiConsent} setAiConsent={setAiConsent} setTab={setTab} preview={preview} setPreview={setPreview} writeups={writeups} startEditWriteup={startEditWriteup} unpublish={unpublish} publishWriteup={publishWriteup} deleteWriteup={deleteWriteup} role={role} topicTags={topicTags} setTopicTags={setTopicTags} productTags={productTags} setProductTags={setProductTags} />}

          {tab === "Media" && <MediaTab mediaList={mediaList} mediaUploading={mediaUploading} mediaUploadProgress={mediaUploadProgress} editingWriteup={editingWriteup} uid={uid} role={role} track={track} setMsg={setMsg} setErr={setErr} loadMedia={loadMedia} setMediaUploading={setMediaUploading} setMediaUploadProgress={setMediaUploadProgress} />}

          {tab === "Live ticker" && <LiveTickerTab uid={uid} role={role} events={events} track={track} setMsg={setMsg} setErr={setErr} />}

          {tab === "Partners" && <PartnersTab />}

          {tab === "My profile" && <MyProfileTab uid={uid!} setMsg={setMsg} setErr={setErr} />}
        </main>
      </div>
      <Footer />
    </>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import FormField from "@/components/form/FormField";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  validateEvent as validateEventSchema,
  type EventForm,
  validateWriteup as validateWriteupSchema,
} from "@/lib/validators";
import ReactMarkdown from "react-markdown";
import PartnersTab from "./PartnersTab";
import { getUserById, getEvents, getWriteups, getMediaByWriteup, getTicker } from "@/lib/data";
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
  const [preview, setPreview] = useState(true);

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
        tags: { topics: [], products: [] },
        aiDrafted: false,
      };
      if (publish) { data.status = "published"; data.publishedAt = serverTimestamp(); }
      else { data.status = "draft"; }
      if (editingWriteup) await updateDoc(doc(db, "writeups", editingWriteup.id), data);
      else await addDoc(collection(db, "writeups"), data);
      setMsg(publish ? "Published" : "Draft saved");
      setEditingWriteup(null);
      setWf({ eventId: "", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }] });
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
    loadMedia(w.id);
  }

  if (allowed === null) return <><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading dashboard…</main></>;
  if (!allowed) return <><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[48px] uppercase">Not allowed</h1><p className="mt-2 text-sm">This dashboard is available to track leads and admins.</p></main></>;

  return (
    <>
      <header className="mx-auto flex max-w-[1280px] flex-wrap items-center border-b-[3px] border-ink">
        <a href="/" className="border-r-[3px] border-ink px-[22px] py-[14px] font-display text-[30px] uppercase tracking-[1px]">GDG<span className="text-blue">.</span>TUM</a>
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

          {tab === "Overview" && (
            <section>
              <h1 className="font-display text-[clamp(42px,6vw,64px)] uppercase leading-none">Overview</h1>
              <p className="mt-[12px] text-[14px] leading-[1.5]">Your track workspace. Manage events, publish writeups and keep your community updated.</p>
              <div className="mt-[24px] grid grid-cols-2 border-l-[3px] border-t-[3px] border-ink sm:grid-cols-3">
                <div className="border-b-[3px] border-r-[3px] border-ink p-[18px]"><p className="font-display text-[48px] leading-none">{events.length}</p><p className="mt-[8px] text-[11px] font-bold uppercase">Events</p></div>
                <div className="border-b-[3px] border-r-[3px] border-ink bg-yellow p-[18px]"><p className="font-display text-[48px] leading-none">{writeups.length}</p><p className="mt-[8px] text-[11px] font-bold uppercase">Your writeups</p></div>
                <div className="border-b-[3px] border-r-[3px] border-ink p-[18px]"><p className="font-display text-[48px] leading-none">{writeups.filter((item) => item.status === "published").length}</p><p className="mt-[8px] text-[11px] font-bold uppercase">Published</p></div>
              </div>
              <div className="mt-[22px] flex flex-wrap gap-[10px]">
                <button type="button" onClick={() => setTab("New writeup")} className="border-[3px] border-ink bg-yellow px-[18px] py-[12px] text-[12px] font-bold uppercase">New writeup ↗</button>
                <button type="button" onClick={() => setTab("My events")} className="border-[3px] border-ink px-[18px] py-[12px] text-[12px] font-bold uppercase">Manage events ↗</button>
              </div>
            </section>
          )}

          {tab === "My events" && (
            <section>
              <h2 className="font-display text-2xl uppercase">My events</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveEvent(); }} className="mt-4 grid gap-2">
                <FormField label="Title" id="et" error={eventErrors.title}>
                  <input id="et" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value } as any)} className="border-[3px] border-ink px-3 py-2" />
                </FormField>
                <FormField label="Date" id="ed" error={eventErrors.date}>
                  <input id="ed" type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                </FormField>
                <FormField label="Venue" id="ev" error={eventErrors.venue}>
                  <input id="ev" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                </FormField>
                <FormField label="Status" id="es">
                  <select id="es" value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as EventForm["status"] })} className="border-[3px] border-ink px-3 py-2">
                    <option value="upcoming">upcoming</option><option value="live">live</option><option value="past">past</option><option value="cancelled">cancelled</option>
                  </select>
                </FormField>
                {role === "admin" && (
                  <FormField label="Track" id="etr" error={eventErrors.trackId}>
                    <select id="etr" value={eventForm.trackId} onChange={(e) => setEventForm({ ...eventForm, trackId: e.target.value })} className="border-[3px] border-ink px-3 py-2">
                      <option value="">select</option><option value="cloud">cloud</option><option value="cybersecurity">cybersecurity</option><option value="web">web</option><option value="women-in-tech">women-in-tech</option>
                    </select>
                  </FormField>
                )}
                <FormField label="Attendance" id="ea">
                  <input id="ea" type="number" min={0} value={eventForm.attendance} onChange={(e) => setEventForm({ ...eventForm, attendance: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                </FormField>
                <button disabled={saving} className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{saving ? "Saving..." : (editingEvent ? "Update event" : "Create event")}</button>
                {editingEvent && <button type="button" onClick={() => { setEditingEvent(null); setEventForm({ title: "", date: "", venue: "", status: "upcoming", attendance: "", trackId: "" }); }} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">Cancel</button>}
              </form>
              <div className="mt-4">
                {events.length === 0 && <p>No events.</p>}
                {events.map((ev) => (
                  <div key={ev.id} className="border-[3px] border-ink p-3 mt-2">
                    <div className="font-bold">{ev.title} — {ev.status}</div>
                    <div className="text-sm">{ev.venue} · {ev.date?.toDate ? ev.date.toDate().toLocaleString() : ev.date}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => startEditEvent(ev)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Edit</button>
                      <button onClick={() => cancelEvent(ev.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Cancel event</button>
                      {role === "admin" && <button onClick={() => deleteEvent(ev.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "New writeup" && (
            <section>
              <h2 className="font-display text-[clamp(42px,6vw,56px)] uppercase leading-none">{editingWriteup ? "Edit writeup" : "New writeup"}</h2>
              <div className="mt-[20px] grid grid-cols-1 border-[3px] border-ink sm:grid-cols-3">
                <div className="border-b-[3px] border-ink bg-ink px-[14px] py-[13px] text-[11px] font-bold uppercase text-white sm:border-b-0 sm:border-r-[3px]">1&nbsp; Add your notes</div>
                <div className="border-b-[3px] border-ink bg-yellow px-[14px] py-[13px] text-[11px] font-bold uppercase sm:border-b-0 sm:border-r-[3px]">2&nbsp; AI draft</div>
                <div className="px-[14px] py-[13px] text-[11px] font-bold uppercase">3&nbsp; Review &amp; publish</div>
              </div>
              <div className="mt-[20px] grid grid-cols-1 gap-0 border-[3px] border-ink lg:grid-cols-2">
                <form onSubmit={(e) => { e.preventDefault(); saveWriteup(false); }} className="grid content-start gap-[12px] p-[18px] sm:p-[24px]">
                  <FormField label="Event" id="we" error={wfErrors.eventId}>
                    <select id="we" value={wf.eventId} onChange={(e) => setWf({ ...wf, eventId: e.target.value })} className="border-[3px] border-ink px-3 py-2">
                      <option value="">select</option>
                      {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Title" id="wt" error={wfErrors.title}>
                    <input id="wt" value={wf.title} onChange={(e) => setWf({ ...wf, title: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                  </FormField>
                  <FormField label="Summary" id="ws">
                    <textarea id="ws" value={wf.summary} onChange={(e) => setWf({ ...wf, summary: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                  </FormField>
                  <FormField label="Attendance" id="wa" error={wfErrors.attendance}>
                    <input id="wa" type="number" min={0} value={wf.attendance} onChange={(e) => setWf({ ...wf, attendance: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                  </FormField>
                  <FormField label="Links" id="wl" error={wfErrors.links}>
                    <div className="grid gap-2">
                      {wf.links.map((l: any, i: number) => (
                        <div key={i} className="flex gap-2">
                          <input placeholder="Title" value={l.title} onChange={(e) => { const links = [...wf.links]; links[i].title = e.target.value; setWf({ ...wf, links }); }} className="border-[3px] border-ink px-2 py-1 flex-1" />
                          <input placeholder="URL" value={l.url} onChange={(e) => { const links = [...wf.links]; links[i].url = e.target.value; setWf({ ...wf, links }); }} className="border-[3px] border-ink px-2 py-1 flex-1" />
                        </div>
                      ))}
                      <button type="button" onClick={() => setWf({ ...wf, links: [...wf.links, { title: "", url: "" }] })} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">+ Link</button>
                    </div>
                  </FormField>
                  <FormField label="Body (Markdown)" id="wb" error={wfErrors.body}>
                    <textarea id="wb" value={wf.body} onChange={(e) => setWf({ ...wf, body: e.target.value })} className="border-[3px] border-ink px-3 py-2" rows={10} />
                  </FormField>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveWriteup(false)} disabled={saving} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">{saving ? "Saving..." : "Save draft"}</button>
                    <button type="button" onClick={() => saveWriteup(true)} disabled={saving} className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{saving ? "Saving..." : "Publish"}</button>
                    <button type="button" disabled className="border-[3px] border-ink px-4 py-2 font-bold uppercase opacity-60">Generate draft with AI (coming soon)</button>
                    <button type="button" onClick={() => setPreview((p) => !p)} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">Toggle preview</button>
                  </div>
                </form>
                {preview && (
                  <aside className="border-t-[3px] border-ink bg-[#fafafa] p-[18px] sm:p-[24px] lg:border-l-[3px] lg:border-t-0">
                    <div className="flex flex-wrap items-center justify-between gap-[8px]">
                      <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Draft preview</span>
                      <span className="text-[11px] font-bold uppercase">Editable in the form</span>
                    </div>
                    <h3 className="mt-[18px] font-display text-[34px] uppercase leading-[1]">{wf.title || "Your writeup title"}</h3>
                    <div className="mt-[16px] border-[3px] border-ink bg-white p-[18px] text-[13px] leading-[1.65]">
                      {wf.summary && <p className="mb-[16px]"><strong>Summary.</strong> {wf.summary}</p>}
                      {wf.body ? <ReactMarkdown>{wf.body}</ReactMarkdown> : <p className="text-[#666]">Your notes and writeup content will appear here as you draft.</p>}
                      {!wf.summary && !wf.body && <p className="mt-[14px]"><strong>Resources.</strong> Links you add will be included with your published writeup.</p>}
                    </div>
                    <div className="mt-[16px] border-[3px] border-ink bg-red p-[13px] text-[12px] font-bold leading-[1.5]">
                      Review names, numbers and links before publishing. You are responsible for the accuracy of your writeup.
                    </div>
                  </aside>
                )}
              </div>
              <h3 className="font-display text-xl uppercase mt-6">My writeups</h3>
              <div className="mt-2 grid gap-2">
                {writeups.map((w) => (
                  <div key={w.id} className="border-[3px] border-ink p-3">
                    <div className="font-bold">{w.title} — {w.status}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => startEditWriteup(w)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Edit</button>
                      {w.status === "published" ? (
                        <button onClick={() => unpublish(w.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Unpublish</button>
                      ) : (
                        <button onClick={() => publishWriteup(w.id)} className="border-[3px] border-ink bg-ink px-3 py-1 text-sm font-bold uppercase text-white">Publish</button>
                      )}
                      {role === "admin" && <button onClick={() => deleteWriteup(w.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "Media" && (
            <section>
              <h2 className="font-display text-2xl uppercase">Media</h2>
              <p className="mt-2 text-sm">Only upload photos where people have agreed to be shown.</p>
              <p className="mt-1 text-xs">Media is attached to the writeup currently being edited. Select a writeup in &quot;New writeup&quot; first, or a draft will be created.</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                if (f.size > 5 * 1024 * 1024) { setErr("File too large (max 5MB)"); return; }
                try {
                  const { url, publicId } = await uploadToCloudinary(f);
                  let wid = editingWriteup?.id;
                  if (!wid) {
                    const ref = await addDoc(collection(db, "writeups"), { title: "[Draft]", trackId: track, authorId: uid, body: "", status: "draft", aiDrafted: false, tags: { topics: [], products: [] } });
                    wid = ref.id;
                    setEditingWriteup({ id: wid });
                  }
                  await addDoc(collection(db, "media"), { writeupId: wid, url, publicId, caption: "", altText: "", captionSource: "lead", createdBy: uid });
                  setMsg("Uploaded"); loadMedia(wid);
                } catch (er: any) { setErr(er?.message || "Upload failed"); }
              }} className="mt-4" />
              <div className="mt-4 grid gap-3">
                {mediaList.map((m) => (
                  <div key={m.id} className="border-[3px] border-ink p-3">
                    <img src={m.url} alt={m.altText || m.caption || ""} className="h-32 w-32 object-cover" />
                    <input defaultValue={m.caption} onBlur={async (e) => { try { await updateDoc(doc(db, "media", m.id), { caption: e.target.value }); setMsg("Caption saved"); } catch (er: any) { setErr(er?.message || "Failed"); } }} placeholder="Caption" className="mt-2 border-[3px] border-ink px-2 py-1 w-full" />
                    <input defaultValue={m.altText} onBlur={async (e) => { try { await updateDoc(doc(db, "media", m.id), { altText: e.target.value }); setMsg("Alt text saved"); } catch (er: any) { setErr(er?.message || "Failed"); } }} placeholder="Alt text" className="mt-2 border-[3px] border-ink px-2 py-1 w-full" />
                    {role === "admin" || (editingWriteup && (editingWriteup.authorId === uid || (role === "lead" && editingWriteup.trackId === track))) && (
                      <button onClick={async () => { if (!confirm("Remove this photo?")) return; try { await deleteDoc(doc(db, "media", m.id)); setMsg("Removed (file stays in Cloudinary)"); loadMedia(editingWriteup?.id); } catch (er: any) { setErr(er?.message || "Failed"); } }} className="mt-2 border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Remove</button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs">Note: removing a media doc does not delete the file from Cloudinary.</p>
            </section>
          )}

          {tab === "Live ticker" && (
            <section>
              <h2 className="font-display text-2xl uppercase">Live ticker</h2>
              <TickerTab uid={uid} events={events} track={track} setMsg={setMsg} setErr={setErr} />
            </section>
          )}

          {tab === "Partners" && <PartnersTab />}

          {tab === "My profile" && (
            <section>
              <h2 className="font-display text-2xl uppercase">My profile</h2>
              <ProfileTab uid={uid!} setMsg={setMsg} setErr={setErr} />
            </section>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}


function TickerTab({ uid, events, track, setMsg, setErr }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState({ eventId: "", message: "" });
  async function load() {
    const fetched = await getTicker();
    setEntries(fetched as any[]);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [uid, track]);
  async function goLive(id: string, evTrack: string) {
    try {
      // end others for same track
      const ev = events.find((e: any) => e.id === entries.find((x) => x.id === id)?.eventId);
      const t = ev?.trackId || track;
      for (const e of entries) {
        if (e.id !== id && e.status === "active") {
          const ev2 = events.find((x: any) => x.id === e.eventId);
          if ((ev2?.trackId || track) === t) await updateDoc(doc(db, "ticker", e.id), { status: "inactive", updatedAt: serverTimestamp() });
        }
      }
      await updateDoc(doc(db, "ticker", id), { status: "active", updatedAt: serverTimestamp() });
      setMsg("Live"); load();
    } catch (er: any) { setErr(er?.message || "Failed"); }
  }
  async function end(id: string) {
    try { await updateDoc(doc(db, "ticker", id), { status: "inactive", updatedAt: serverTimestamp() }); setMsg("Ended"); load(); }
    catch (er: any) { setErr(er?.message || "Failed"); }
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    try { await deleteDoc(doc(db, "ticker", id)); setMsg("Deleted"); load(); }
    catch (er: any) { setErr(er?.message || "Failed"); }
  }
  async function create(e: any) {
    e.preventDefault();
    if (!form.eventId || !form.message.trim()) { setErr("Event and message required"); return; }
    if (form.message.length > 140) { setErr("Message must be 140 characters or fewer"); return; }
    try {
      await addDoc(collection(db, "ticker"), { eventId: form.eventId, message: form.message, status: "inactive", createdBy: uid, updatedAt: serverTimestamp() });
      setMsg("Created"); setForm({ eventId: "", message: "" }); load();
    } catch (er: any) { setErr(er?.message || "Failed"); }
  }
  return (
    <div>
      <form onSubmit={create} className="grid gap-2">
        <select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} className="border-[3px] border-ink px-3 py-2">
          <option value="">select event</option>
          {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" className="border-[3px] border-ink px-3 py-2" />
        <p className="mt-0.5 mb-0 text-xs text-ink">{form.message.length}/140</p>
        <button className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">Create entry</button>
      </form>
      <div className="mt-4 grid gap-2">
        {entries.map((t: any) => (
          <div key={t.id} className="border-[3px] border-ink p-3">
            <div className="font-bold">{t.message} — {t.status}</div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => goLive(t.id, "")} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Go live</button>
              <button onClick={() => end(t.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">End</button>
              <button onClick={() => remove(t.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function ProfileTab({ uid, setMsg, setErr }: any) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<any[]>([{ title: "", url: "" }]);
  const [photoUrl, setPhotoUrl] = useState("");
  useEffect(() => {
    (async () => {
      const userData = await getUserById(uid);
      if (userData) {
        const d = userData;
        setName(d.name || ""); setBio(d.bio || ""); setLinks(d.links?.length ? d.links : [{ title: "", url: "" }]); setPhotoUrl(d.photoUrl || "");
      }
    })();
  }, [uid]);
  async function save() {
    const bad = links.some((l) => l.url && !/^https?:\/\//.test(l.url));
    if (bad) { setErr("Links must start with http(s)://"); return; }
    try {
      await updateDoc(doc(db, "users", uid), { name, bio, links: links.filter((l) => l.url), photoUrl });
      setMsg("Profile saved");
    } catch (er: any) { setErr(er?.message || "Failed"); }
  }
  async function uploadPhoto(e: any) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr("File too large"); return; }
    if (!["image/jpeg","image/png","image/webp"].includes(f.type)) { setErr("Invalid type"); return; }
    try {
      const { url } = await uploadToCloudinary(f);
      setPhotoUrl(url);
      setMsg("Photo uploaded");
    } catch (er: any) { setErr(er?.message || "Upload failed"); }
  }
  return (
    <div className="grid gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="border-[3px] border-ink px-3 py-2" />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className="border-[3px] border-ink px-3 py-2" />
      {links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input value={l.title} onChange={(e) => { const x=[...links]; x[i].title=e.target.value; setLinks(x); }} placeholder="Title" className="border-[3px] border-ink px-2 py-1 flex-1" />
          <input value={l.url} onChange={(e) => { const x=[...links]; x[i].url=e.target.value; setLinks(x); }} placeholder="URL" className="border-[3px] border-ink px-2 py-1 flex-1" />
        </div>
      ))}
      <button type="button" onClick={() => setLinks([...links, { title: "", url: "" }])} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">+ Link</button>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} />
      {photoUrl && <img src={photoUrl} alt="preview" className="h-24 w-24 object-cover border-[3px] border-ink" />}
      <button onClick={save} className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">Save profile</button>
    </div>
  );
}

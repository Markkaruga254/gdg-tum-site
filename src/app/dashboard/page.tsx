"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [preview, setPreview] = useState(true);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiPhotoIds, setAiPhotoIds] = useState<string[]>([]);

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
              <div className="flex flex-wrap items-center justify-between gap-[12px]">
                <h2 className="font-display text-[clamp(42px,6vw,56px)] uppercase leading-none">{editingWriteup ? "Edit writeup" : "New writeup"}</h2>
                {editingWriteup && <button type="button" onClick={() => { setEditingWriteup(null); setWf({ eventId: "", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }] }); setMediaList([]); setAiConsent(false); setAiPhotoIds([]); }} className="border-[3px] border-ink px-[12px] py-[9px] text-[11px] font-bold uppercase">Start new writeup</button>}
              </div>
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
                  <FormField label="Rough notes / writeup body (Markdown)" id="wb" error={wfErrors.body}>
                    <textarea id="wb" value={wf.body} onChange={(e) => setWf({ ...wf, body: e.target.value })} className="border-[3px] border-ink px-3 py-2" rows={10} />
                  </FormField>
                  <section className="border-[3px] border-ink p-[14px]">
                    <h3 className="text-[12px] font-bold uppercase">Photos, slides &amp; links</h3>
                    {mediaList.length ? (
                      <div className="mt-[12px] grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                        {mediaList.map((media) => (
                          <label key={media.id} className="border-[2px] border-ink p-[7px]">
                            <img src={media.url} alt={media.altText || media.caption || "Uploaded event media"} className="aspect-[4/3] w-full object-cover" />
                            <span className="mt-[7px] flex items-start gap-[7px] text-[10px] font-bold uppercase leading-[1.4]">
                              <input
                                type="checkbox"
                                checked={aiPhotoIds.includes(media.id)}
                                onChange={(event) => setAiPhotoIds((current) => event.target.checked ? [...current, media.id] : current.filter((id) => id !== media.id))}
                              />
                              Send for AI caption
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-[8px] text-[12px] leading-[1.5]">Save a draft, then use the Media tab to upload event photos. Each photo stays opted out of AI processing unless you select it here.</p>
                    )}
                    <button type="button" onClick={() => setTab("Media")} className="mt-[12px] border-[3px] border-ink px-[12px] py-[8px] text-[11px] font-bold uppercase">Manage media ↗</button>
                  </section>
                  <label className="flex items-start gap-[10px] border-[3px] border-ink bg-yellow p-[12px] text-[12px] leading-[1.5]">
                    <input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} className="mt-[2px]" />
                    <span>I confirm I have permission to submit these notes and only the photos I select for AI processing. AI-generated content must be reviewed before publishing.</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveWriteup(false)} disabled={saving} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">{saving ? "Saving..." : "Save draft"}</button>
                    <button type="button" onClick={() => saveWriteup(true)} disabled={saving} className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{saving ? "Saving..." : "Publish"}</button>
                    <button type="button" disabled title="AI draft generation will be enabled when the approved AI service is deployed." className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white opacity-50">Generate draft · Coming soon</button>
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
              <p className="mt-1 text-xs">Media is attached to the writeup currently selected in &quot;New writeup&quot;. Save a draft or select an existing writeup before uploading.</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={mediaUploading} onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                if (f.size > 5 * 1024 * 1024) { setErr("File too large (max 5MB)"); return; }
                if (!editingWriteup?.id) {
                  setErr("Save a draft or select a writeup before uploading media.");
                  e.target.value = "";
                  return;
                }
                setMediaUploading(true);
                setMediaUploadProgress(0);
                try {
                  const { url, publicId } = await uploadToCloudinary(f, setMediaUploadProgress);
                  const wid = editingWriteup.id;
                  await addDoc(collection(db, "media"), { writeupId: wid, url, publicId, caption: "", altText: "", captionSource: "lead", createdBy: uid });
                  setMediaUploadProgress(100);
                  setMsg("Uploaded");
                  await loadMedia(wid);
                } catch (er: any) { setErr(er?.message || "Upload failed"); }
                finally { setMediaUploading(false); e.target.value = ""; }
              }} className="mt-4 disabled:opacity-50" />
              {mediaUploading && (
                <div className="mt-[12px]" aria-live="polite">
                  <div className="mb-[6px] flex justify-between text-[11px] font-bold uppercase"><span>Uploading photo</span><span>{mediaUploadProgress}%</span></div>
                  <div role="progressbar" aria-label="Photo upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mediaUploadProgress} className="h-[12px] border-[2px] border-ink">
                    <div className="h-full bg-green" style={{ width: `${mediaUploadProgress}%` }} />
                  </div>
                </div>
              )}
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
              <TickerTab uid={uid} role={role} events={events} track={track} setMsg={setMsg} setErr={setErr} />
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


function TickerTab({ uid, role, events, track, setMsg, setErr }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState({ eventId: "", message: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    try {
      const fetched = await getTicker();
      setEntries(fetched as any[]);
    } catch (error: any) {
      setErr(error?.message || "Ticker entries could not be loaded.");
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [uid, track]);

  async function goLive(id: string) {
    try {
      const ev = events.find((event: any) => event.id === entries.find((item) => item.id === id)?.eventId);
      const currentTrack = ev?.trackId || track;
      for (const entry of entries) {
        if (entry.id !== id && entry.status === "active") {
          const otherEvent = events.find((event: any) => event.id === entry.eventId);
          if ((otherEvent?.trackId || track) === currentTrack) {
            await updateDoc(doc(db, "ticker", entry.id), { status: "inactive", updatedAt: serverTimestamp() });
          }
        }
      }
      await updateDoc(doc(db, "ticker", id), { status: "active", updatedAt: serverTimestamp() });
      setMsg("Ticker is live.");
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker could not be made live.");
    }
  }

  async function end(id: string) {
    try {
      await updateDoc(doc(db, "ticker", id), { status: "inactive", updatedAt: serverTimestamp() });
      setMsg("Ticker entry ended.");
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker entry could not be ended.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this ticker entry?")) return;
    try {
      await deleteDoc(doc(db, "ticker", id));
      setMsg("Ticker entry deleted.");
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker entry could not be deleted.");
    }
  }

  function startEdit(entry: any) {
    setEditingId(entry.id);
    setForm({ eventId: entry.eventId, message: entry.message });
  }

  async function save(e: any) {
    e.preventDefault();
    if (!form.eventId || !form.message.trim()) {
      setErr("Event and message are required.");
      return;
    }
    if (form.message.length > 140) {
      setErr("Message must be 140 characters or fewer.");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, "ticker", editingId), { message: form.message.trim(), updatedAt: serverTimestamp() });
        setMsg("Ticker entry updated.");
      } else {
        await addDoc(collection(db, "ticker"), { eventId: form.eventId, message: form.message.trim(), status: "inactive", createdBy: uid, updatedAt: serverTimestamp() });
        setMsg("Ticker entry created.");
      }
      setEditingId(null);
      setForm({ eventId: "", message: "" });
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker entry could not be saved.");
    }
  }

  return (
    <div>
      <form onSubmit={save} className="grid gap-2 border-[3px] border-ink p-[16px]">
        <label htmlFor="ticker-event" className="text-[11px] font-bold uppercase">Event</label>
        <select id="ticker-event" value={form.eventId} disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, eventId: event.target.value })} className="border-[3px] border-ink px-3 py-2 disabled:bg-[#f5f5f5]">
          <option value="">Select event</option>
          {events.map((event: any) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
        <label htmlFor="ticker-message" className="text-[11px] font-bold uppercase">Message</label>
        <input id="ticker-message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} maxLength={140} placeholder="Live update" className="border-[3px] border-ink px-3 py-2" />
        <p className="text-xs">{form.message.length}/140</p>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{editingId ? "Save changes" : "Create entry"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ eventId: "", message: "" }); }} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">Cancel edit</button>}
        </div>
      </form>
      <div className="mt-4 grid gap-2">
        {entries.map((entry: any) => {
          const canManage = role === "admin" || entry.createdBy === uid;
          return (
            <article key={entry.id} className="border-[3px] border-ink p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-bold">{entry.message}</p><p className="mt-1 text-xs font-bold uppercase">{entry.status}</p></div>
                <p className="text-xs">{events.find((event: any) => event.id === entry.eventId)?.title || "Event"}</p>
              </div>
              {canManage && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.status !== "active" && <button type="button" onClick={() => void goLive(entry.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Go live</button>}
                  {entry.status === "active" && <button type="button" onClick={() => void end(entry.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">End</button>}
                  <button type="button" onClick={() => startEdit(entry)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Edit</button>
                  <button type="button" onClick={() => void remove(entry.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}


function ProfileTab({ uid, setMsg, setErr }: any) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<any[]>([{ title: "", url: "" }]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setUploading(true);
    setUploadProgress(0);
    try {
      const { url } = await uploadToCloudinary(f, setUploadProgress);
      setPhotoUrl(url);
      setUploadProgress(100);
      setMsg("Photo uploaded");
    } catch (er: any) { setErr(er?.message || "Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
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
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={uploadPhoto} />
      {uploading && <div aria-live="polite"><p className="text-[11px] font-bold uppercase">Uploading profile photo · {uploadProgress}%</p><div role="progressbar" aria-label="Profile photo upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress} className="mt-1 h-[10px] border-[2px] border-ink"><div className="h-full bg-green" style={{ width: `${uploadProgress}%` }} /></div></div>}
      {photoUrl && <img src={photoUrl} alt="preview" className="h-24 w-24 object-cover border-[3px] border-ink" />}
      <button onClick={save} className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">Save profile</button>
    </div>
  );
}

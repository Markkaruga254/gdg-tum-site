"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
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
import GalleryManagerTab from "./GalleryManagerTab";
import { getUserById, getEvents, getWriteups, getMediaByWriteup } from "@/lib/data";
import type { TrackSlug } from "@/lib/types";
import { TRACKS } from "@/lib/tracks";
import LeadDashboardNavigation from "@/components/dashboard/LeadDashboardNavigation";
import { generatePhotoCaptions, generateWriteupDraft } from "@/lib/writeup-ai";

export default function DashboardPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [track, setTrack] = useState<string>("");
  const [tab, setTab] = useState("Overview");
  const [events, setEvents] = useState<any[]>([]);
  const [writeups, setWriteups] = useState<any[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // event form state
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({ title: "", date: "", venue: "", description: "", status: "upcoming", attendance: "", trackId: "" });
  const [eventErrors, setEventErrors] = useState<any>({});

  // writeup form state
  const [editingWriteup, setEditingWriteup] = useState<any | null>(null);
  const [wf, setWf] = useState({ eventId: "", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }] });
  const [wfErrors, setWfErrors] = useState<any>({});
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [writeupStep, setWriteupStep] = useState(1);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiPhotoIds, setAiPhotoIds] = useState<string[]>([]);
  const [aiDrafted, setAiDrafted] = useState(false);
  const [aiSourceNotes, setAiSourceNotes] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiCaptioning, setAiCaptioning] = useState(false);
  const [aiCaptionSuggestions, setAiCaptionSuggestions] = useState<any[]>([]);
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);
  const aiServiceConfigured = Boolean(process.env.NEXT_PUBLIC_WRITEUP_AI_API_URL);

  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        if (active) setAllowed(false);
        return;
      }
      try {
        const userData = await getUserById(u.uid);
        if (!active) return;
        const r = userData?.role ?? "member";
        const assignedTrack = typeof userData?.track === "string" ? userData.track : "";
        const validLeadTrack = TRACKS.some((item) => item.slug === assignedTrack);
        const ok = r === "admin" || (r === "lead" && validLeadTrack);
        setRole(r);
        setTrack(assignedTrack);
        setAllowed(ok);
        if (ok) {
          setUid(u.uid);
        } else if (r === "lead") {
          setErr("Your Lead account needs a valid track assignment before you can access the workspace. Contact a GDG TUM administrator.");
        }
      } catch {
        if (active) {
          setErr("Your staff profile could not be loaded.");
          setAllowed(false);
        }
      }
    });
    return () => { active = false; unsub(); };
  }, []);

  async function loadEvents() {
    try {
      const fetched = role === "lead" ? await getEvents({ trackId: track as TrackSlug }) : await getEvents();
      setEvents(fetched as any[]);
    } catch {
      setEvents([]);
      setErr("Events could not be loaded in the dashboard.");
    }
  }
  async function loadWriteups() {
    if (!uid) return;
    try {
      const fetched = role === "admin" ? await getWriteups() : await getWriteups({ trackId: track as TrackSlug });
      setWriteups(fetched as any[]);
    } catch {
      setWriteups([]);
      setErr("Your writeups could not be loaded.");
    }
  }
  async function loadMedia(wid: string) {
    try {
      const fetched = await getMediaByWriteup(wid);
      setMediaList(fetched as any[]);
    } catch {
      setMediaList([]);
      setErr("Media for this writeup could not be loaded.");
    }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (allowed && uid) { void loadEvents(); void loadWriteups(); } }, [allowed, uid, role, track]);

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
        title: eventForm.title, venue: eventForm.venue, description: eventForm.description.trim(), status: eventForm.status,
        trackId: role === "admin" ? eventForm.trackId : track,
        date: Timestamp.fromDate(new Date(eventForm.date)),
        attendance: eventForm.attendance ? Number(eventForm.attendance) : null,
      };
      if (editingEvent) await updateDoc(doc(db, "events", editingEvent.id), data);
      else await addDoc(collection(db, "events"), data);
      setMsg(editingEvent ? "Event updated" : "Event created");
      setEditingEvent(null);
      setEventForm({ title: "", date: "", venue: "", description: "", status: "upcoming", attendance: "", trackId: "" });
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
    setEventForm({ title: ev.title, date: local, venue: ev.venue, description: ev.description ?? "", status: ev.status, attendance: ev.attendance ?? "", trackId: ev.trackId });
  }

  async function generateDraft() {
    setErr(""); setMsg("");
    if (!wf.eventId) { setErr("Choose an event before generating a draft."); return; }
    const sourceNotes = aiDrafted ? aiSourceNotes : wf.body;
    if (sourceNotes.trim().length < 20) { setErr("Add at least 20 characters of facilitator notes before generating a draft."); return; }
    setAiGenerating(true);
    setMsg("Generating draft… Gemini may take a little longer during periods of high demand. The service will retry temporary failures automatically.");
    try {
      const draft = await generateWriteupDraft({
        eventId: wf.eventId,
        ...(editingWriteup?.id ? { writeupId: editingWriteup.id } : {}),
        notes: sourceNotes,
      });
      setWf((current) => ({ ...current, title: draft.title, summary: draft.summary, body: draft.body }));
      setTopicTags(draft.topicTags);
      setProductTags(draft.productTags);
      setAiSourceNotes(sourceNotes);
      setAiDrafted(true);
      setWriteupStep(3);
      setMsg("AI draft generated. Review every detail before saving or publishing.");
    } catch (error: any) {
      setErr(error?.message || "AI draft generation failed.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function generateAiCaptions() {
    setErr(""); setMsg("");
    if (!editingWriteup?.id) { setErr("Save this writeup as a draft before generating photo captions."); return; }
    if (!aiConsent) { setErr("Confirm photo consent before sending images for AI captioning."); return; }
    if (aiPhotoIds.length === 0) { setErr("Select at least one photo to caption."); return; }
    setAiCaptioning(true);
    setMsg("Generating photo captions… Temporary Gemini failures are retried automatically.");
    try {
      const suggestions = await generatePhotoCaptions({
        writeupId: editingWriteup.id,
        mediaIds: aiPhotoIds,
        consentConfirmed: true,
      });
      setAiCaptionSuggestions(suggestions);
      setMsg(`Generated ${suggestions.length} photo caption suggestion(s). Review and apply them individually.`);
    } catch (error: any) {
      setErr(error?.message || "Photo caption generation failed.");
    } finally {
      setAiCaptioning(false);
    }
  }

  async function applyAiCaption(suggestion: any) {
    setErr(""); setMsg("");
    if (!editingWriteup?.id || !suggestion?.mediaId) return;
    try {
      await updateDoc(doc(db, "media", suggestion.mediaId), {
        caption: suggestion.caption,
        altText: suggestion.altText,
        captionSource: "ai",
        aiCaptionedAt: serverTimestamp(),
      });
      setAiCaptionSuggestions((current) => current.filter((item) => item.mediaId !== suggestion.mediaId));
      await loadMedia(editingWriteup.id);
      setMsg("AI caption and alt text applied. You can still edit them in Media.");
    } catch (error: any) {
      setErr(error?.message || "Could not apply the AI caption.");
    }
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
        eventId: wf.eventId,
        trackId: editingWriteup?.trackId || ev?.trackId || track,
        authorId: editingWriteup?.authorId || uid,
        title: wf.title, summary: wf.summary, body: wf.body,
        attendance: wf.attendance ? Number(wf.attendance) : null,
        links: wf.links.filter((l: any) => l.url),
        tags: { topics: topicTags, products: productTags },
        aiDrafted,
      };
      if (publish) {
        data.status = "published";
        if (editingWriteup?.status !== "published") data.publishedAt = serverTimestamp();
      } else {
        data.status = "draft";
      }
      let savedId = editingWriteup?.id;
      if (editingWriteup) {
        await updateDoc(doc(db, "writeups", editingWriteup.id), data);
      } else {
        const created = await addDoc(collection(db, "writeups"), data);
        savedId = created.id;
      }
      setMsg(publish ? "Published" : "Draft saved");
      if (savedId) {
        setEditingWriteup({
          ...(editingWriteup ?? {}),
          id: savedId,
          authorId: data.authorId,
          trackId: data.trackId,
          status: data.status,
          aiDrafted: data.aiDrafted,
        });
        await loadMedia(savedId);
      }
      if (ev) {
        await updateDoc(doc(db, "events", ev.id), {
          writeupId: publish ? savedId : (ev.writeupId === editingWriteup?.id ? null : ev.writeupId ?? null),
        });
      }
      await loadWriteups();
    } catch (e: any) { setErr(e?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function publishWriteup(id: string) {
    setErr(""); setMsg("");
    const target = writeups.find((item) => item.id === id);
    if (!target) {
      setErr("That writeup could not be found. Refresh the dashboard and try again.");
      await loadWriteups();
      return;
    }
    const errors = validateWriteupSchema({
      eventId: target.eventId || "",
      title: target.title || "",
      summary: target.summary || "",
      body: target.body || "",
      attendance: target.attendance ?? "",
      links: target.links || [],
    }, true);
    if (Object.keys(errors).length > 0) {
      startEditWriteup(target);
      setWfErrors(errors);
      setErr("This writeup needs a few required details before it can be published. Review the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "writeups", id), {
        status: "published",
        publishedAt: target.publishedAt ?? serverTimestamp(),
      });
      if (target.eventId) {
        await updateDoc(doc(db, "events", target.eventId), { writeupId: id });
      }
      setMsg("Published");
      await loadWriteups();
    } catch (e: any) {
      setErr(e?.code === "permission-denied" ? "You can only publish writeups you are allowed to manage." : e?.message || "Failed");
    } finally {
      setSaving(false);
    }
  }
  async function unpublish(id: string) {
    try {
      const target = writeups.find((item) => item.id === id);
      await updateDoc(doc(db, "writeups", id), { status: "draft" });
      if (target?.eventId && events.find((event) => event.id === target.eventId)?.writeupId === id) {
        await updateDoc(doc(db, "events", target.eventId), { writeupId: null });
      }
      setMsg("Unpublished");
      await loadWriteups();
    }
    catch (e: any) { setErr(e?.code === "permission-denied" ? "You can only unpublish writeups in your own track." : e?.message || "Failed"); }
  }
  async function deleteWriteup(id: string) {
    if (!confirm("Delete this writeup?")) return;
    try { await deleteDoc(doc(db, "writeups", id)); setMsg("Deleted"); await loadWriteups(); }
    catch (e: any) { setErr(e?.message || "Failed"); }
  }
  function startNewWriteup() {
    setEditingWriteup(null);
    setWfErrors({});
    setWf({ eventId: "", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }] });
    setMediaList([]);
    setAiConsent(false);
    setAiPhotoIds([]);
    setAiDrafted(false);
    setAiSourceNotes("");
    setAiCaptionSuggestions([]);
    setTopicTags([]);
    setProductTags([]);
    setWriteupStep(1);
    setTab("New writeup");
  }

  function startEditWriteup(w: any) {
    setEditingWriteup(w);
    setWfErrors({});
    setWriteupStep(1);
    setTab("New writeup");
    setWf({ eventId: w.eventId, title: w.title, summary: w.summary || "", body: w.body || "", attendance: w.attendance ?? "", links: w.links?.length ? w.links : [{ title: "", url: "" }] });
    setAiConsent(false);
    setAiPhotoIds([]);
    setAiDrafted(Boolean(w.aiDrafted));
    setAiSourceNotes(w.body || "");
    setAiCaptionSuggestions([]);
    setTopicTags(w.tags?.topics || []);
    setProductTags(w.tags?.products || []);
    loadMedia(w.id);
  }

  if (allowed === null) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading dashboard…</main><Footer /></>;
  if (!allowed) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[48px] uppercase">Workspace unavailable</h1><p className="mt-2 max-w-[620px] text-sm">{err || "This dashboard is available to provisioned track leads and admins."}</p><Link href="/" className="mt-6 inline-flex border-[3px] border-ink bg-yellow px-[16px] py-[12px] text-[11px] font-bold uppercase">Return to public site ↗</Link></main><Footer /></>;

  return (
    <>
      <header className="mx-auto flex max-w-[1280px] flex-wrap items-center border-b-[3px] border-ink">
        <Link href="/" aria-label="GDG.TUM home" className="border-r-[3px] border-ink px-[16px] py-[14px] font-display text-[28px] uppercase leading-none tracking-[1px] sm:px-[22px] sm:text-[30px]">
          GDG<span className="text-blue">.</span>TUM
        </Link>
        <span className="min-w-0 flex-1 px-[12px] py-[12px] text-[10px] font-bold uppercase tracking-[.5px] sm:px-[20px] sm:text-[12px]">{tab === "New writeup" && writeupStep === 1 ? "Lead workspace · New writeup" : "Lead workspace"}</span>
        <span className="order-3 border-t-[3px] border-ink bg-blue px-[14px] py-[13px] text-[10px] font-bold uppercase tracking-[.5px] text-white sm:order-none sm:border-l-[3px] sm:border-t-0 sm:px-[20px] sm:py-[22px] sm:text-[12px]">
          {role === "admin" ? "Admin" : `${track.replaceAll("-", " ")} Track`}
        </span>
        <div className="order-4 flex w-full border-t-[3px] border-ink sm:order-none sm:ml-auto sm:w-auto sm:border-l-[3px] sm:border-t-0">
          <Link href="/" aria-label="View public GDG TUM website" className="flex flex-1 items-center justify-center gap-2 bg-yellow px-[14px] py-[13px] text-[10px] font-bold uppercase tracking-[.04em] hover:bg-[#f2c900] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue sm:flex-none sm:px-[16px] sm:py-[22px] sm:text-[11px]">
            View public site <span aria-hidden="true">↗</span>
          </Link>
          <button type="button" onClick={() => void signOut()} className="border-l-[3px] border-ink px-[14px] py-[13px] text-[10px] font-bold uppercase hover:bg-[#f3f3f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue sm:px-[16px] sm:py-[22px] sm:text-[11px]">
            Sign out
          </button>
        </div>
      </header>
      <div data-testid="dashboard-layout" className="mx-auto grid max-w-[1280px] grid-cols-1 border-x-[3px] border-ink md:grid-cols-[minmax(180px,230px)_minmax(0,1fr)]">
        <LeadDashboardNavigation role={role} tab={tab} onTabChange={setTab} />
        <main className="min-w-0 px-[12px] pb-[112px] pt-[16px] sm:px-[28px] sm:pt-[28px] md:pb-[28px]">
          {msg && <p className="mb-2 text-sm text-green">{msg}</p>}
          {err && <p className="mb-2 text-sm text-red">{err}</p>}

          {tab === "Overview" && <OverviewTab events={events} writeups={writeups} setTab={setTab} startEditWriteup={startEditWriteup} startNewWriteup={startNewWriteup} unpublish={unpublish} publishWriteup={publishWriteup} deleteWriteup={deleteWriteup} role={role} uid={uid} track={track} saving={saving} />}

          {tab === "Track events" && <MyEventsTab events={events} role={role} eventForm={eventForm} setEventForm={setEventForm} eventErrors={eventErrors} saveEvent={saveEvent} saving={saving} editingEvent={editingEvent} setEditingEvent={setEditingEvent} startEditEvent={startEditEvent} cancelEvent={cancelEvent} deleteEvent={deleteEvent} />}

          {tab === "New writeup" && <NewWriteupTab editingWriteup={editingWriteup} wf={wf} setWf={setWf} wfErrors={wfErrors} events={events} saveWriteup={saveWriteup} saving={saving} mediaList={mediaList} aiPhotoIds={aiPhotoIds} setAiPhotoIds={setAiPhotoIds} aiConsent={aiConsent} setAiConsent={setAiConsent} setTab={setTab} writeupStep={writeupStep} setWriteupStep={setWriteupStep} topicTags={topicTags} setTopicTags={setTopicTags} productTags={productTags} setProductTags={setProductTags} generateDraft={generateDraft} aiGenerating={aiGenerating} generateAiCaptions={generateAiCaptions} aiCaptioning={aiCaptioning} aiCaptionSuggestions={aiCaptionSuggestions} applyAiCaption={applyAiCaption} aiDrafted={aiDrafted} aiSourceNotes={aiSourceNotes} setAiSourceNotes={setAiSourceNotes} aiServiceConfigured={aiServiceConfigured} />}

          {tab === "Media" && <MediaTab mediaList={mediaList} mediaUploading={mediaUploading} mediaUploadProgress={mediaUploadProgress} editingWriteup={editingWriteup} uid={uid} role={role} track={track} setMsg={setMsg} setErr={setErr} loadMedia={loadMedia} setMediaUploading={setMediaUploading} setMediaUploadProgress={setMediaUploadProgress} />}

          {tab === "Gallery" && role === "admin" && <GalleryManagerTab events={events} uid={uid} setMsg={setMsg} setErr={setErr} />}

          {tab === "Live ticker" && <LiveTickerTab uid={uid} role={role} events={events} track={track} setMsg={setMsg} setErr={setErr} />}

          {tab === "Partners" && <PartnersTab />}

          {tab === "My profile" && <MyProfileTab uid={uid!} setMsg={setMsg} setErr={setErr} />}
        </main>
      </div>
    </>
  );
}

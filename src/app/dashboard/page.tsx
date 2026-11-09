"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
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
import { generatePhotoCaption, generateWriteupDraft, isWriteupAIConfigured } from "@/lib/ai-writeups";

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
  const [eventForm, setEventForm] = useState<EventForm>({ title: "", date: "", venue: "", description: "", status: "upcoming", attendance: "", trackId: "" });
  const [eventErrors, setEventErrors] = useState<any>({});

  // writeup form state
  const [editingWriteup, setEditingWriteup] = useState<any | null>(null);
  const [wf, setWf] = useState({ eventId: "", title: "", summary: "", body: "", notes: "", attendance: "", links: [{ title: "", url: "" }] });
  const [wfErrors, setWfErrors] = useState<any>({});
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [writeupStep, setWriteupStep] = useState(1);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiPhotoIds, setAiPhotoIds] = useState<string[]>([]);
  const [topicTags, setTopicTags] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [aiDrafted, setAiDrafted] = useState(false);
  const [aiReviewed, setAiReviewed] = useState(false);
  const [publicationConfirmed, setPublicationConfirmed] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [captioningPhotos, setCaptioningPhotos] = useState(false);
  const [aiActionError, setAiActionError] = useState("");
  const aiConfigured = isWriteupAIConfigured();

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
        const ok = r === "lead" || r === "admin";
        setAllowed(ok);
        if (ok) {
          setUid(u.uid);
          setRole(r);
          setTrack(userData?.track ?? "");
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
      const fetched = role === "lead" && track ? await getEvents({ trackId: track as TrackSlug }) : await getEvents();
      setEvents(fetched as any[]);
    } catch {
      setEvents([]);
      setErr("Events could not be loaded in the dashboard.");
    }
  }
  async function loadWriteups() {
    if (!uid) return;
    try {
      const fetched = role === "admin" ? await getWriteups() : await getWriteups({ authorId: uid });
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

  function validateWriteup(publish: boolean) {
    const errors = validateWriteupSchema(wf, publish);
    const needsFinalReview = publish || editingWriteup?.status === "published";
    if (needsFinalReview && !publicationConfirmed) {
      errors.review = "Confirm that you have checked the article, links and media permissions before publishing or updating a live writeup.";
    }
    if (needsFinalReview && aiDrafted && !aiReviewed) {
      errors.aiReviewed = "Review the AI-assisted text before publishing or changing a live AI-assisted writeup.";
    }
    setWfErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function saveWriteup(publish: boolean) {
    setErr(""); setMsg(""); setAiActionError("");
    if (!validateWriteup(publish)) return;
    const ev = events.find((x) => x.id === wf.eventId);
    if (!ev) {
      setErr("Select a valid event before saving this writeup.");
      return;
    }
    if (editingWriteup && ev.trackId !== editingWriteup.trackId) {
      setErr("A writeup must stay in the same track as its original event. Select an event from the same track.");
      return;
    }
    setSaving(true);
    try {
      const keepPublished = editingWriteup?.status === "published" && !publish;
      const nextStatus = publish || keepPublished ? "published" : "draft";
      const data: any = {
        eventId: wf.eventId,
        trackId: editingWriteup?.trackId || ev.trackId || track,
        authorId: editingWriteup?.authorId || uid,
        title: wf.title.trim(),
        summary: wf.summary.trim(),
        body: wf.body,
        attendance: wf.attendance ? Number(wf.attendance) : null,
        links: wf.links.filter((link: any) => link.url.trim()).map((link: any) => ({ title: link.title.trim(), url: link.url.trim() })),
        tags: { topics: topicTags, products: productTags },
        status: nextStatus,
        publishedAt: nextStatus === "published" ? (editingWriteup?.publishedAt || serverTimestamp()) : null,
        aiDrafted: Boolean(aiDrafted),
        aiReviewed: Boolean(aiDrafted && aiReviewed),
        aiReviewedBy: aiDrafted && aiReviewed ? uid : null,
        aiReviewedAt: aiDrafted && aiReviewed ? serverTimestamp() : null,
        reviewed: Boolean(publicationConfirmed),
        reviewedBy: publicationConfirmed ? uid : null,
        reviewedAt: publicationConfirmed ? serverTimestamp() : null,
      };
      let savedId = editingWriteup?.id;
      if (editingWriteup) {
        await updateDoc(doc(db, "writeups", editingWriteup.id), data);
      } else {
        const created = await addDoc(collection(db, "writeups"), data);
        savedId = created.id;
      }
      setMsg(publish ? "Writeup published" : nextStatus === "published" ? "Changes saved; the writeup remains published" : "Draft saved");
      if (savedId) {
        setEditingWriteup({
          ...editingWriteup,
          id: savedId,
          authorId: data.authorId,
          trackId: data.trackId,
          status: data.status,
          aiDrafted: data.aiDrafted,
          aiReviewed: data.aiReviewed,
          reviewed: data.reviewed,
          publishedAt: nextStatus === "published" ? (editingWriteup?.publishedAt || Timestamp.now()) : null,
        });
        await loadMedia(savedId);
      }
      setAiReviewed(data.aiReviewed);
      setPublicationConfirmed(data.reviewed);
      await loadWriteups();
    } catch (e: any) {
      setErr(e?.code === "permission-denied"
        ? "Firestore denied this write. Check that your lead account owns this writeup and that its event belongs to your track."
        : e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function publishWriteup(id: string) {
    setErr(""); setMsg("");
    const writeup = writeups.find((item) => item.id === id);
    if (!writeup) {
      setErr("This writeup is no longer in your dashboard. Reload the page and try again.");
      return;
    }
    const linkedEvent = events.find((event) => event.id === writeup.eventId);
    if (!linkedEvent || linkedEvent.trackId !== writeup.trackId) {
      setErr("The linked event is missing or no longer belongs to this track. Edit the writeup and select a valid event before publishing.");
      return;
    }
    const errors = validateWriteupSchema({
      eventId: writeup.eventId,
      title: writeup.title,
      summary: writeup.summary || "",
      body: writeup.body || "",
      attendance: writeup.attendance == null ? "" : String(writeup.attendance),
      links: writeup.links || [],
    }, true);
    if (Object.keys(errors).length) {
      setErr("This writeup is incomplete. Open Edit, correct the highlighted fields and save it before publishing.");
      return;
    }
    if (!writeup.reviewed || (writeup.aiDrafted && !writeup.aiReviewed)) {
      setErr("This draft still needs its final editorial review. Open Edit, complete the review confirmations and save it first.");
      return;
    }
    if (!confirm("Publish this reviewed writeup on the public GDG TUM website?")) return;
    try {
      await updateDoc(doc(db, "writeups", id), { status: "published", publishedAt: serverTimestamp(), reviewed: true, reviewedBy: uid, reviewedAt: serverTimestamp(), ...(writeup.aiDrafted ? { aiReviewed: true, aiReviewedBy: uid, aiReviewedAt: serverTimestamp() } : {}) });
      setEditingWriteup((current: any) => current?.id === id ? { ...current, status: "published", publishedAt: Timestamp.now(), reviewed: true, reviewedBy: uid, aiReviewed: Boolean(writeup.aiDrafted) } : current);
      setWriteups((current: any[]) => current.map((item) => item.id === id ? { ...item, status: "published", publishedAt: Timestamp.now(), reviewed: true, reviewedBy: uid, aiReviewed: Boolean(writeup.aiDrafted) } : item));
      setMsg("Writeup published");
      await loadWriteups();
    } catch (e: any) {
      setErr(e?.code === "permission-denied" ? "You can only publish writeups in your own track." : e?.message || "Failed to publish writeup");
    }
  }
  async function unpublish(id: string) {
    if (!confirm("Unpublish this writeup? It will be removed from the public Writeups page but remain available as a draft.")) return;
    try { await updateDoc(doc(db, "writeups", id), { status: "draft", publishedAt: null }); setEditingWriteup((current: any) => current?.id === id ? { ...current, status: "draft", publishedAt: null } : current); setWriteups((current: any[]) => current.map((item) => item.id === id ? { ...item, status: "draft", publishedAt: null } : item)); setMsg("Writeup unpublished"); await loadWriteups(); }
    catch (e: any) { setErr(e?.code === "permission-denied" ? "You can only unpublish writeups in your own track." : e?.message || "Failed"); }
  }
  async function deleteWriteup(id: string) {
    if (!confirm("Delete this writeup and its media records? The uploaded Cloudinary files themselves will remain in Cloudinary.")) return;
    try {
      const attachedMedia = await getMediaByWriteup(id);
      const batch = writeBatch(db);
      for (const media of attachedMedia) batch.delete(doc(db, "media", media.id));
      batch.delete(doc(db, "writeups", id));
      await batch.commit();
      setMsg("Writeup and attached media records deleted");
      await loadWriteups();
    } catch (e: any) { setErr(e?.message || "Failed to delete writeup"); }
  }
  function startNewWriteup() {
    setEditingWriteup(null);
    setWfErrors({});
    setErr("");
    setMsg("");
    setWf({ eventId: "", title: "", summary: "", body: "", notes: "", attendance: "", links: [{ title: "", url: "" }] });
    setMediaList([]);
    setAiConsent(false);
    setAiPhotoIds([]);
    setTopicTags([]);
    setProductTags([]);
    setAiDrafted(false);
    setAiReviewed(false);
    setPublicationConfirmed(false);
    setAiActionError("");
    setGeneratingDraft(false);
    setCaptioningPhotos(false);
    setWriteupStep(1);
    setTab("New writeup");
  }

  function startEditWriteup(w: any) {
    setMediaList([]);
    setWfErrors({});
    setErr("");
    setMsg("");
    setEditingWriteup(w);
    setWriteupStep(1);
    setTab("New writeup");
    setWf({ eventId: w.eventId, title: w.title, summary: w.summary || "", body: w.body || "", notes: "", attendance: w.attendance == null ? "" : String(w.attendance), links: w.links?.length ? w.links : [{ title: "", url: "" }] });
    setAiConsent(false);
    setAiPhotoIds([]);
    setTopicTags(w.tags?.topics || []);
    setProductTags(w.tags?.products || []);
    setAiDrafted(Boolean(w.aiDrafted));
    setAiReviewed(Boolean(w.aiReviewed));
    setPublicationConfirmed(false);
    setAiActionError("");
    loadMedia(w.id);
  }

  async function generateDraft() {
    setAiActionError("");
    const event = events.find((item) => item.id === wf.eventId);
    if (!event) {
      setAiActionError("Select the event before generating a draft.");
      return;
    }
    if (aiDrafted && wf.body.trim() && !confirm("Regenerating replaces the current title, summary, article body and suggested tags. Continue?")) return;
    setGeneratingDraft(true);
    try {
      const eventDate = event.date?.toDate ? event.date.toDate().toLocaleDateString("en-GB") : "";
      const generated = await generateWriteupDraft({
        notes: wf.notes || "",
        eventTitle: event.title,
        eventDescription: event.description || "",
        eventDate,
        venue: event.venue || "",
        trackName: String(event.trackId).replaceAll("-", " "),
        trackId: String(event.trackId),
      });
      setWf((current) => ({ ...current, title: generated.title, summary: generated.summary, body: generated.body }));
      setTopicTags(generated.topics);
      setProductTags(generated.products);
      setAiDrafted(true);
      setAiReviewed(false);
      setPublicationConfirmed(false);
      setWriteupStep(2);
      setMsg("AI draft generated. Review and edit every section before publishing.");
    } catch (e: any) {
      setAiActionError(e?.message || "AI drafting failed. You can continue writing manually.");
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function generatePhotoCaptions() {
    setAiActionError("");
    if (!aiConsent || aiPhotoIds.length === 0) {
      setAiActionError("Select photos and confirm consent before requesting AI captions.");
      return;
    }
    if (!editingWriteup?.id) {
      setAiActionError("Save this writeup as a draft before generating photo captions.");
      return;
    }
    if (editingWriteup.status === "published") {
      setAiActionError("Unpublish this writeup before generating or changing photo captions.");
      return;
    }
    const selected = mediaList.filter((media) => aiPhotoIds.includes(media.id));
    if (!selected.length) {
      setAiActionError("The selected photos could not be found. Refresh the media list and try again.");
      return;
    }
    if (selected.length > 5) {
      setAiActionError("Select no more than five photos per captioning batch to control processing and quota use.");
      return;
    }
    setCaptioningPhotos(true);
    let completed = 0;
    const failures: string[] = [];
    try {
      for (const media of selected) {
        try {
          const caption = await generatePhotoCaption(media.url, aiConsent, editingWriteup.trackId);
          const batch = writeBatch(db);
          batch.update(doc(db, "media", media.id), { caption, captionSource: "ai" });
          batch.update(doc(db, "writeups", editingWriteup.id), {
            aiDrafted: true,
            aiReviewed: false,
            aiReviewedBy: null,
            aiReviewedAt: null,
            reviewed: false,
            reviewedBy: null,
            reviewedAt: null,
          });
          await batch.commit();
          completed += 1;
        } catch (e: any) {
          failures.push(e?.message || "A photo caption failed.");
        }
      }
      await loadMedia(editingWriteup.id);
      if (completed) {
        setAiDrafted(true);
        setAiReviewed(false);
        setPublicationConfirmed(false);
        setEditingWriteup((current: any) => current ? { ...current, aiDrafted: true, aiReviewed: false, reviewed: false } : current);
        setWriteups((current: any[]) => current.map((item) => item.id === editingWriteup.id ? { ...item, aiDrafted: true, aiReviewed: false, reviewed: false } : item));
        setMsg(`Generated ${completed} AI photo caption${completed === 1 ? "" : "s"}. Review them in the Media tab.`);
      }
      if (failures.length) setAiActionError(failures.join(" "));
    } finally {
      setCaptioningPhotos(false);
    }
  }

  function invalidateEditorialReviewAfterMediaChange() {
    const writeupId = editingWriteup?.id;
    setPublicationConfirmed(false);
    if (aiDrafted) setAiReviewed(false);
    setEditingWriteup((current: any) => current ? {
      ...current,
      reviewed: false,
      ...(current.aiDrafted ? { aiReviewed: false } : {}),
    } : current);
    if (writeupId) {
      setWriteups((current: any[]) => current.map((item) => item.id === writeupId ? {
        ...item,
        reviewed: false,
        ...(item.aiDrafted ? { aiReviewed: false } : {}),
      } : item));
    }
  }

  function updateWriteupForm(next: any) {
    setWf(next);
    if (aiDrafted) setAiReviewed(false);
    setPublicationConfirmed(false);
  }

  function updateTopicTags(next: string[]) {
    setTopicTags(next);
    if (aiDrafted) setAiReviewed(false);
    setPublicationConfirmed(false);
  }

  function updateProductTags(next: string[]) {
    setProductTags(next);
    if (aiDrafted) setAiReviewed(false);
    setPublicationConfirmed(false);
  }

  if (allowed === null) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading dashboard…</main><Footer /></>;
  if (!allowed) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[48px] uppercase">Not allowed</h1><p className="mt-2 text-sm">This dashboard is available to track leads and admins.</p></main><Footer /></>;

  return (
    <>
      <header className="mx-auto flex max-w-[1280px] flex-wrap items-center border-b-[3px] border-ink">
        <Link href="/" aria-label="GDG.TUM home" className="border-r-[3px] border-ink px-[22px] py-[14px] font-display text-[30px] uppercase leading-none tracking-[1px]">
          GDG.TUM
        </Link>
        <span className="px-[20px] text-[12px] font-bold uppercase tracking-[.5px]">{tab === "New writeup" && writeupStep === 1 ? "Lead dashboard · New writeup" : "Lead dashboard"}</span>
        <span className="ml-auto border-l-[3px] border-ink bg-blue px-[20px] py-[22px] text-[12px] font-bold uppercase tracking-[.5px] text-white">
          {role === "admin" ? "Admin" : `${track.replaceAll("-", " ")} Track`}
        </span>
      </header>
      <div data-testid="dashboard-layout" className={`mx-auto grid max-w-[1280px] border-x-[3px] border-ink ${tab === "New writeup" && writeupStep === 1 ? "grid-cols-1" : "grid-cols-[minmax(180px,230px)_minmax(0,1fr)]"}`}>
        {!(tab === "New writeup" && writeupStep === 1) && (
          <aside data-testid="dashboard-sidebar" className="min-w-0 border-r-[3px] border-ink">
            {(TABS.filter((t) => {
              if (t === "Partners") return role === "admin";
              if (t === "Live ticker") return role === "admin" || role === "lead";
              return true;
            })).map((t) => (
              <button key={t} type="button" onClick={() => t === "New writeup" ? (editingWriteup ? setTab("New writeup") : startNewWriteup()) : setTab(t)} aria-current={tab === t ? "page" : undefined} className={`block w-full border-b-[3px] border-ink px-[10px] py-[14px] text-left text-[10px] font-bold uppercase leading-[1.3] sm:px-[18px] sm:py-[17px] sm:text-[11px] ${tab === t ? "bg-yellow" : "bg-white"}`}>{t}</button>
            ))}
          </aside>
        )}
        <main className="min-w-0 p-[12px] sm:p-[28px]">
          {msg && <p className="mb-2 text-sm text-green">{msg}</p>}
          {err && <p className="mb-2 text-sm text-red">{err}</p>}

          {tab === "Overview" && <OverviewTab events={events} writeups={writeups} setTab={setTab} startEditWriteup={startEditWriteup} startNewWriteup={startNewWriteup} unpublish={unpublish} publishWriteup={publishWriteup} deleteWriteup={deleteWriteup} role={role} uid={uid} track={track} />}

          {tab === "My events" && <MyEventsTab events={events} role={role} eventForm={eventForm} setEventForm={setEventForm} eventErrors={eventErrors} saveEvent={saveEvent} saving={saving} editingEvent={editingEvent} setEditingEvent={setEditingEvent} startEditEvent={startEditEvent} cancelEvent={cancelEvent} deleteEvent={deleteEvent} />}

          {tab === "New writeup" && <NewWriteupTab wf={wf} setWf={updateWriteupForm} wfErrors={wfErrors} events={events} saveWriteup={saveWriteup} saving={saving} mediaList={mediaList} aiPhotoIds={aiPhotoIds} setAiPhotoIds={setAiPhotoIds} aiConsent={aiConsent} setAiConsent={setAiConsent} setTab={setTab} writeupStep={writeupStep} setWriteupStep={setWriteupStep} topicTags={topicTags} setTopicTags={updateTopicTags} productTags={productTags} setProductTags={updateProductTags} aiDrafted={aiDrafted} setAiDrafted={setAiDrafted} aiReviewed={aiReviewed} setAiReviewed={setAiReviewed} publicationConfirmed={publicationConfirmed} setPublicationConfirmed={setPublicationConfirmed} isPublished={editingWriteup?.status === "published"} generateDraft={generateDraft} generatingDraft={generatingDraft} generatePhotoCaptions={generatePhotoCaptions} captioningPhotos={captioningPhotos} aiConfigured={aiConfigured} aiActionError={aiActionError} hasSavedWriteup={Boolean(editingWriteup?.id)} />}

          {tab === "Media" && <MediaTab mediaList={mediaList} mediaUploading={mediaUploading} mediaUploadProgress={mediaUploadProgress} editingWriteup={editingWriteup} uid={uid} role={role} setMsg={setMsg} setErr={setErr} loadMedia={loadMedia} setMediaUploading={setMediaUploading} setMediaUploadProgress={setMediaUploadProgress} onReturnToWriteup={() => setTab("New writeup")} onMediaChanged={invalidateEditorialReviewAfterMediaChange} isPublished={editingWriteup?.status === "published"} />}

          {tab === "Live ticker" && <LiveTickerTab uid={uid} role={role} events={events} track={track} setMsg={setMsg} setErr={setErr} />}

          {tab === "Partners" && <PartnersTab />}

          {tab === "My profile" && <MyProfileTab uid={uid!} setMsg={setMsg} setErr={setErr} />}
        </main>
      </div>
    </>
  );
}

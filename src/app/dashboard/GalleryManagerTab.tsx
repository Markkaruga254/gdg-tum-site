"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary, destroyGalleryPhoto } from "@/lib/cloudinary";
import { TRACKS } from "@/lib/tracks";

type GalleryManagerTabProps = {
  events: Array<{ id: string; title: string; trackId: string }>;
  uid: string | null;
  setMsg: (message: string) => void;
  setErr: (message: string) => void;
};

export default function GalleryManagerTab({ events, uid, setMsg, setErr }: GalleryManagerTabProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [trackId, setTrackId] = useState("cloud");
  const [eventId, setEventId] = useState("");
  const [order, setOrder] = useState("0");

  async function loadPhotos() {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, "galleryPhotos"), orderBy("createdAt", "desc")));
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      items.sort((a: any, b: any) => Number(a.order ?? 0) - Number(b.order ?? 0)
        || (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setPhotos(items);
    } catch (error: any) {
      setErr(error?.message || "Gallery photos could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPhotos(); }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(""); setMsg("");
    const form = event.currentTarget;
    const file = (form.elements.namedItem("gallery-photo") as HTMLInputElement).files?.[0];
    if (!file) { setErr("Choose a photo to upload."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("File too large (maximum 5 MB)."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setErr("Only JPEG, PNG or WebP images are allowed."); return; }
    if (!caption.trim() || !altText.trim()) { setErr("Add both a caption and descriptive alt text."); return; }
    if (!TRACKS.some((track) => track.slug === trackId)) { setErr("Choose a valid track."); return; }
    setUploading(true); setProgress(0);
    try {
      const { url, publicId } = await uploadToCloudinary(file, setProgress, "gallery");
      await addDoc(collection(db, "galleryPhotos"), {
        url, publicId, caption: caption.trim(), altText: altText.trim(),
        trackId, eventId: eventId || null, order: Number(order) || 0,
        status: "draft", createdBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setCaption(""); setAltText(""); setEventId(""); setOrder("0");
      form.reset();
      setMsg("Photo uploaded as a draft. Review it below and publish it when ready.");
      await loadPhotos();
    } catch (error: any) {
      setErr(error?.message || "Photo upload failed.");
    } finally {
      setUploading(false); setProgress(0);
    }
  }

  async function updatePhoto(id: string, changes: Record<string, unknown>, success: string) {
    try {
      await updateDoc(doc(db, "galleryPhotos", id), { ...changes, updatedAt: serverTimestamp() });
      setMsg(success);
      await loadPhotos();
    } catch (error: any) { setErr(error?.message || "Could not update this gallery photo."); }
  }

  async function togglePublished(photo: any) {
    const publish = photo.status !== "published";
    await updatePhoto(photo.id, {
      status: publish ? "published" : "draft",
      ...(publish ? { publishedAt: serverTimestamp() } : {}),
    }, publish ? "Photo published to Moments." : "Photo unpublished.");
  }

  async function removePhoto(photo: any) {
    if (!confirm("Permanently remove this photo from the gallery and Cloudinary?")) return;
    setErr(""); setMsg("");
    try {
      if (photo.publicId) await destroyGalleryPhoto(photo.publicId);
      await deleteDoc(doc(db, "galleryPhotos", photo.id));
      setMsg("Photo and Cloudinary asset removed.");
      await loadPhotos();
    } catch (error: any) {
      setErr(error?.message || "Could not remove this photo.");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-[clamp(38px,5vw,54px)] uppercase leading-none">Gallery manager</h2>
        <p className="mt-2 text-sm">Upload event photos directly to Moments. A writeup is not required. Only published photos appear publicly.</p>
        <p className="mt-1 text-xs">Upload only photos where the people shown have agreed to be published. JPEG, PNG or WebP · maximum 5 MB.</p>
      </div>

      <form onSubmit={upload} className="grid gap-3 border-[3px] border-ink p-4">
        <h3 className="font-display text-2xl uppercase">Add a photo</h3>
        <label className="text-[10px] font-bold uppercase" htmlFor="gallery-photo">Photo</label>
        <input id="gallery-photo" name="gallery-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} required />
        <label className="text-[10px] font-bold uppercase" htmlFor="gallery-caption">Caption</label>
        <input id="gallery-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={160} required className="border-[3px] border-ink px-3 py-2" />
        <label className="text-[10px] font-bold uppercase" htmlFor="gallery-alt">Alt text</label>
        <input id="gallery-alt" value={altText} onChange={(event) => setAltText(event.target.value)} maxLength={250} required className="border-[3px] border-ink px-3 py-2" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-bold uppercase" htmlFor="gallery-track">Track</label>
            <select id="gallery-track" value={trackId} onChange={(event) => setTrackId(event.target.value)} className="mt-1 w-full border-[3px] border-ink px-3 py-2">
              {TRACKS.map((track) => <option key={track.slug} value={track.slug}>{track.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase" htmlFor="gallery-event">Related event (optional)</label>
            <select id="gallery-event" value={eventId} onChange={(event) => setEventId(event.target.value)} className="mt-1 w-full border-[3px] border-ink px-3 py-2">
              <option value="">No linked event</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
          </div>
        </div>
        <label className="text-[10px] font-bold uppercase" htmlFor="gallery-order">Display order (lower numbers appear first)</label>
        <input id="gallery-order" type="number" min="0" step="1" value={order} onChange={(event) => setOrder(event.target.value)} className="w-full border-[3px] border-ink px-3 py-2 sm:max-w-[180px]" />
        {uploading && <div role="progressbar" aria-label="Photo upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-3 border-2 border-ink"><div className="h-full bg-green" style={{ width: progress + "%" }} /></div>}
        <button type="submit" disabled={uploading} className="w-fit border-[3px] border-ink bg-yellow px-4 py-3 text-xs font-bold uppercase disabled:opacity-50">{uploading ? `Uploading ${progress}%…` : "Upload as draft"}</button>
      </form>

      <div>
        <h3 className="font-display text-2xl uppercase">Manage photos ({photos.length})</h3>
        {loading ? <p className="py-4 text-sm">Loading gallery photos…</p> : photos.length === 0 ? <p className="py-4 text-sm">No standalone gallery photos yet.</p> : (
          <div className="mt-3 grid gap-3">
            {photos.map((photo: any) => (
              <article key={photo.id} className="grid gap-3 border-[3px] border-ink p-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                <img src={photo.url} alt={photo.altText || ""} className="h-36 w-full object-cover sm:w-[150px]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase">{photo.status === "published" ? "Published" : "Draft"} · {photo.trackId}</span>
                    <span className="text-[10px] font-bold uppercase">Order {photo.order ?? 0}</span>
                  </div>
                  <label className="mt-2 block text-[10px] font-bold uppercase" htmlFor={`gallery-caption-${photo.id}`}>Caption</label>
                  <input id={`gallery-caption-${photo.id}`} defaultValue={photo.caption} maxLength={160} onBlur={(event) => {
                    if (event.target.value !== photo.caption) void updatePhoto(photo.id, { caption: event.target.value.trim() }, "Caption updated.");
                  }} className="mt-1 w-full border-2 border-ink px-2 py-1 text-sm" />
                  <label className="mt-2 block text-[10px] font-bold uppercase" htmlFor={`gallery-alt-${photo.id}`}>Alt text</label>
                  <input id={`gallery-alt-${photo.id}`} defaultValue={photo.altText} maxLength={250} onBlur={(event) => {
                    if (event.target.value !== photo.altText) void updatePhoto(photo.id, { altText: event.target.value.trim() }, "Alt text updated.");
                  }} className="mt-1 w-full border-2 border-ink px-2 py-1 text-sm" />
                  <label className="mt-2 block text-[10px] font-bold uppercase" htmlFor={`gallery-order-${photo.id}`}>Display order</label>
                  <input id={`gallery-order-${photo.id}`} type="number" min="0" step="1" defaultValue={photo.order ?? 0} onBlur={(event) => {
                    const nextOrder = Number(event.target.value);
                    if (Number.isInteger(nextOrder) && nextOrder >= 0 && nextOrder !== (photo.order ?? 0)) {
                      void updatePhoto(photo.id, { order: nextOrder }, "Display order updated.");
                    }
                  }} className="mt-1 w-24 border-2 border-ink px-2 py-1 text-sm" />
                  {photo.eventId && <p className="mt-1 text-xs">Linked event: {events.find((event) => event.id === photo.eventId)?.title || "Event"}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void togglePublished(photo)} className="border-[2px] border-ink px-3 py-2 text-[10px] font-bold uppercase">{photo.status === "published" ? "Unpublish" : "Publish"}</button>
                    <button type="button" onClick={() => void removePhoto(photo)} className="border-[2px] border-ink px-3 py-2 text-[10px] font-bold uppercase">Delete permanently</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

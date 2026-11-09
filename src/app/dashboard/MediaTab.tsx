"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

function reviewInvalidationPatch(writeup: any) {
  const patch: Record<string, any> = { reviewed: false, reviewedBy: null, reviewedAt: null };
  if (writeup?.aiDrafted) {
    patch.aiReviewed = false;
    patch.aiReviewedBy = null;
    patch.aiReviewedAt = null;
  }
  return patch;
}

async function commitMediaChange(writeup: any, applyMediaChange: (batch: ReturnType<typeof writeBatch>) => void, onMediaChanged?: () => void) {
  if (!writeup?.id) throw new Error("Select and save a writeup before changing its media.");
  const batch = writeBatch(db);
  applyMediaChange(batch);
  batch.update(doc(db, "writeups", writeup.id), reviewInvalidationPatch(writeup));
  await batch.commit();
  onMediaChanged?.();
}

export default function MediaTab({ mediaList, mediaUploading, mediaUploadProgress, editingWriteup, uid, role, setMsg, setErr, loadMedia, setMediaUploading, setMediaUploadProgress, onReturnToWriteup, onMediaChanged, isPublished }: any) {
  return (
    <section>
                  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl uppercase">Media</h2><button type="button" onClick={onReturnToWriteup} className="border-[3px] border-ink bg-yellow px-[12px] py-[9px] text-[10px] font-bold uppercase">← Return to writeup</button></div>
                  <p className="mt-2 text-sm">Only upload photos where people have agreed to be shown.</p>
                  <p className="mt-1 text-xs">Media is attached to the writeup currently selected in &quot;New writeup&quot;. Save a draft or select an existing writeup before uploading.</p>
                  {isPublished && <p role="status" className="mt-3 border-[3px] border-ink bg-yellow p-3 text-xs font-bold">This writeup is published. Unpublish it from Overview before changing photos, captions or alt text, then complete the final review again.</p>}
                  <label htmlFor="writeup-media-upload" className="mt-[16px] block text-[11px] font-bold uppercase">Upload photo (JPEG, PNG or WebP · max 5 MB)</label>
                  <input id="writeup-media-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={!editingWriteup?.id || mediaUploading || isPublished} onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 5 * 1024 * 1024) { setErr("File too large (max 5MB)"); e.target.value = ""; return; }
                    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setErr("Only JPEG, PNG or WebP images are allowed."); e.target.value = ""; return; }
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
                      const mediaRef = doc(collection(db, "media"));
                      await commitMediaChange(editingWriteup, (batch) => {
                        batch.set(mediaRef, { writeupId: wid, url, publicId, caption: "", altText: "", captionSource: "lead", createdBy: uid });
                      }, onMediaChanged);
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
                    {mediaList.map((m: any) => (
                      <div key={m.id} className="border-[3px] border-ink p-3">
                        <img src={m.url} alt={m.altText || m.caption || "Uploaded event photo"} className="h-32 w-32 object-cover" />
                        <p className="mt-1 text-[10px] font-bold uppercase">{m.captionSource === "ai" ? "AI caption · review before publishing" : m.captionSource === "lead" ? "Lead caption" : "Caption not labelled"}</p>
                        <label htmlFor={`media-caption-${m.id}`} className="mt-2 block text-[10px] font-bold uppercase">Caption</label>
                        <input id={`media-caption-${m.id}`} defaultValue={m.caption} disabled={isPublished} onBlur={async (e) => { if (e.target.value === (m.caption || "")) return; try { await commitMediaChange(editingWriteup, (batch) => { batch.update(doc(db, "media", m.id), { caption: e.target.value, captionSource: "lead" }); }, onMediaChanged); setMsg("Caption saved"); } catch (er: any) { setErr(er?.message || "Failed"); } }} className="mt-1 w-full border-[3px] border-ink px-2 py-1 disabled:opacity-50" />
                        <label htmlFor={`media-alt-${m.id}`} className="mt-2 block text-[10px] font-bold uppercase">Alt text</label>
                        <input id={`media-alt-${m.id}`} defaultValue={m.altText} disabled={isPublished} onBlur={async (e) => { if (e.target.value === (m.altText || "")) return; try { await commitMediaChange(editingWriteup, (batch) => { batch.update(doc(db, "media", m.id), { altText: e.target.value }); }, onMediaChanged); setMsg("Alt text saved"); } catch (er: any) { setErr(er?.message || "Failed"); } }} className="mt-1 w-full border-[3px] border-ink px-2 py-1 disabled:opacity-50" />
                        {(role === "admin" || (editingWriteup && editingWriteup.authorId === uid)) && (
                          <button type="button" disabled={isPublished} onClick={async () => { if (!confirm("Remove this photo? The Cloudinary file itself will remain stored.")) return; try { await commitMediaChange(editingWriteup, (batch) => { batch.delete(doc(db, "media", m.id)); }, onMediaChanged); setMsg("Removed (file stays in Cloudinary)"); loadMedia(editingWriteup?.id); } catch (er: any) { setErr(er?.message || "Failed"); } }} className="mt-2 border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs">Note: removing a media doc does not delete the file from Cloudinary.</p>
                </section>
  );
}

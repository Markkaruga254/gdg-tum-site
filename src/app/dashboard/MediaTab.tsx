"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function MediaTab({ mediaList, mediaUploading, mediaUploadProgress, editingWriteup, uid, role, track, setMsg, setErr, loadMedia, setMediaUploading, setMediaUploadProgress }: any) {
  return (
    <section>
                  <h2 className="font-display text-2xl uppercase">Media</h2>
                  <p className="mt-2 text-sm">Only upload photos where people have agreed to be shown.</p>
                  <p className="mt-1 text-xs">Media is attached to the writeup currently selected in &quot;New writeup&quot;. Save a draft or select an existing writeup before uploading.</p>
                  <label htmlFor="writeup-media-upload" className="mt-[16px] block text-[11px] font-bold uppercase">Upload photo (JPEG, PNG or WebP · max 5 MB)</label>
                  <input id="writeup-media-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={mediaUploading} onChange={async (e) => {
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
                        <label htmlFor={`media-caption-${m.id}`} className="mt-2 block text-[10px] font-bold uppercase">Caption</label>
                        <input id={`media-caption-${m.id}`} defaultValue={m.caption} onBlur={async (e) => { try { await updateDoc(doc(db, "media", m.id), { caption: e.target.value }); setMsg("Caption saved"); } catch (er: any) { setErr(er?.message || "Failed"); } }} className="mt-1 w-full border-[3px] border-ink px-2 py-1" />
                        <label htmlFor={`media-alt-${m.id}`} className="mt-2 block text-[10px] font-bold uppercase">Alt text</label>
                        <input id={`media-alt-${m.id}`} defaultValue={m.altText} onBlur={async (e) => { try { await updateDoc(doc(db, "media", m.id), { altText: e.target.value }); setMsg("Alt text saved"); } catch (er: any) { setErr(er?.message || "Failed"); } }} className="mt-1 w-full border-[3px] border-ink px-2 py-1" />
                        {role === "admin" || (editingWriteup && (editingWriteup.authorId === uid || (role === "lead" && editingWriteup.trackId === track))) && (
                          <button onClick={async () => { if (!confirm("Remove this photo?")) return; try { await deleteDoc(doc(db, "media", m.id)); setMsg("Removed (file stays in Cloudinary)"); loadMedia(editingWriteup?.id); } catch (er: any) { setErr(er?.message || "Failed"); } }} className="mt-2 border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs">Note: removing a media doc does not delete the file from Cloudinary.</p>
                </section>
  );
}

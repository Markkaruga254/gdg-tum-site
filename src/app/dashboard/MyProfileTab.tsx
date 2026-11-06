"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProfileTab } from "./ProfileTab";

export default function MyProfileTab({ uid, setMsg, setErr }: any) {
  return (
    <section>
                  <h2 className="font-display text-2xl uppercase">My profile</h2>
                  <ProfileTab uid={uid!} setMsg={setMsg} setErr={setErr} />
                </section>
  );
}

export function ProfileTab({ uid, setMsg, setErr }: any) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<any[]>([{ title: "", url: "" }]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const userData = await getUserById(uid);
        if (userData) {
          const d = userData;
          setName(d.name || "");
          setBio(d.bio || "");
          setLinks(d.links?.length ? d.links : [{ title: "", url: "" }]);
          setPhotoUrl(d.photoUrl || "");
        }
      } catch (error: any) {
        setErr(error?.message || "Profile could not be loaded.");
      }
    })();
  }, [uid]);
  async function save() {
    const bad = links.some((l) => l.url && !/^https?:\/\//.test(l.url));
    if (bad) { setErr("Links must start with http(s)://"); return; }
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", uid), { name, bio, links: links.filter((l) => l.url), photoUrl });
      setMsg("Profile saved");
    } catch (er: any) { setErr(er?.message || "Failed"); }
    finally { setSavingProfile(false); }
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
    <div className="grid max-w-[760px] gap-[14px]">
      <div className="grid gap-[6px]">
        <label htmlFor="profile-name" className="text-[11px] font-bold uppercase">Name</label>
        <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="border-[3px] border-ink px-[12px] py-[10px]" />
      </div>
      <div className="grid gap-[6px]">
        <label htmlFor="profile-bio" className="text-[11px] font-bold uppercase">Bio</label>
        <textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="border-[3px] border-ink px-[12px] py-[10px]" />
      </div>
      <fieldset className="grid gap-[10px] border-[3px] border-ink p-[14px]">
        <legend className="px-[6px] text-[11px] font-bold uppercase">Profile links</legend>
        {links.map((link, index) => (
          <div key={index} className="grid grid-cols-1 gap-[8px] sm:grid-cols-[1fr_1.5fr_auto]">
            <label className="grid gap-[5px] text-[10px] font-bold uppercase">
              Link title
              <input value={link.title} onChange={(e) => { const next = [...links]; next[index] = { ...next[index], title: e.target.value }; setLinks(next); }} className="min-w-0 border-[3px] border-ink px-[9px] py-[8px] text-[13px] font-normal normal-case" />
            </label>
            <label className="grid gap-[5px] text-[10px] font-bold uppercase">
              URL
              <input type="url" value={link.url} onChange={(e) => { const next = [...links]; next[index] = { ...next[index], url: e.target.value }; setLinks(next); }} className="min-w-0 border-[3px] border-ink px-[9px] py-[8px] text-[13px] font-normal normal-case" />
            </label>
            <button type="button" onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={links.length === 1} className="self-end border-[3px] border-ink px-[10px] py-[8px] text-[10px] font-bold uppercase disabled:opacity-40">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setLinks([...links, { title: "", url: "" }])} className="w-fit border-[3px] border-ink px-[12px] py-[8px] text-[11px] font-bold uppercase">+ Add link</button>
      </fieldset>
      <div className="grid gap-[6px]">
        <label htmlFor="profile-photo" className="text-[11px] font-bold uppercase">Profile photo (JPEG, PNG or WebP · max 5 MB)</label>
        <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={uploadPhoto} />
      </div>
      {uploading && <div aria-live="polite"><p className="text-[11px] font-bold uppercase">Uploading profile photo · {uploadProgress}%</p><div role="progressbar" aria-label="Profile photo upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress} className="mt-1 h-[10px] border-[2px] border-ink"><div className="h-full bg-green" style={{ width: `${uploadProgress}%` }} /></div></div>}
      {photoUrl && <img src={photoUrl} alt={name ? `${name} profile photo` : "Profile photo preview"} className="h-24 w-24 border-[3px] border-ink object-cover" />}
      <button type="button" onClick={() => void save()} disabled={savingProfile || uploading} className="w-fit border-[3px] border-ink bg-ink px-[18px] py-[12px] text-[12px] font-bold uppercase text-white disabled:opacity-50">{savingProfile ? "Saving…" : "Save profile"}</button>
    </div>
  );
}

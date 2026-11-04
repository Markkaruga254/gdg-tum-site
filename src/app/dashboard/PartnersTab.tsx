"use client";
import { useEffect, useState } from "react";
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { validatePartner } from "@/lib/validators";
import type { Partner, PartnerType } from "@/lib/types";
import type { PartnerForm } from "@/lib/validators";
import FormField from "@/components/form/FormField";
import Tag from "@/components/Tag";

const TYPE_LABELS: Record<PartnerType, string> = {
  university: "University",
  community: "Community",
  sponsor: "Sponsor",
  company: "Company",
};

const TYPE_COLORS: Record<PartnerType, "blue" | "red" | "green" | "yellow"> = {
  university: "blue",
  community: "green",
  sponsor: "red",
  company: "yellow",
};

const ACTIVE_COLOR = "text-green";
const INACTIVE_COLOR = "text-red";

export default function PartnersTab() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>({ name: "", link: "", type: "company", order: "0", active: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    const snap = await getDocs(collection(db, "partners"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Partner));
    list.sort((a, b) => a.order - b.order);
    setPartners(list);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", link: "", type: "company", order: "0", active: true });
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
    setErr("");
    setMsg("");
  }

  function startEdit(p: Partner) {
    setEditingId(p.id);
    setForm({ name: p.name, link: p.link, type: p.type, order: String(p.order), active: p.active });
    setLogoPreview(p.logoUrl ?? null);
    setLogoFile(null);
    setErrors({});
    setErr("");
    setMsg("");
  }

  async function save(e: any) {
    e.preventDefault();
    setErr(""); setMsg("");
    const e2 = validatePartner(form);
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;
    setUploading(true);
    try {
      const current = partners.find((p) => p.id === editingId);
      let finalLogoUrl = current?.logoUrl;
      if (logoFile) {
        const { url } = await uploadToCloudinary(logoFile, (p) => setUploadProgress(p));
        finalLogoUrl = url;
      }
      const data: any = {
        name: form.name.trim(),
        link: form.link.trim(),
        type: form.type,
        order: Number(form.order),
        active: form.active,
      };
      if (finalLogoUrl) data.logoUrl = finalLogoUrl;
      if (editingId) await updateDoc(doc(db, "partners", editingId), data);
      else await addDoc(collection(db, "partners"), data);
      setMsg(editingId ? "Partner updated" : "Partner created");
      resetForm();
      await load();
    } catch (err2: any) { setErr(err2?.message || "Save failed"); }
    finally { setUploading(false); setUploadProgress(null); }
  }

  async function toggleActive(p: Partner) {
    try {
      await updateDoc(doc(db, "partners", p.id), { active: !p.active });
      setMsg(`${p.active ? "Deactivated" : "Reactivated"} ${p.name}`);
      await load();
    } catch (err2: any) { setErr(err2?.message || "Failed"); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this partner?")) return;
    try {
      await deleteDoc(doc(db, "partners", id));
      setMsg("Partner deleted");
      await load();
    } catch (err2: any) { setErr(err2?.message || "Delete failed"); }
  }

  function handleLogoChange(e: any) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { setErr("Only jpeg, png or webp images are allowed"); return; }
    if (f.size > 5 * 1024 * 1024) { setErr("File too large (max 5MB)"); return; }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
    setErr("");
  }

  const editing = partners.find((p) => p.id === editingId);

  return (
    <div>
      <section>
        <h2 className="font-display text-2xl uppercase">Partners</h2>
        <button onClick={resetForm} className="mt-4 border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">Add partner</button>
        <div className="mt-4 grid gap-2">
          {partners.length === 0 && <p>No partners.</p>}
          {partners.map((p) => (
            <div key={p.id} className="border-[3px] border-ink p-3 mt-2 flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex-1">
                <div className="font-bold">{p.name}</div>
                <div className="text-sm">{p.link}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Tag label={TYPE_LABELS[p.type]} color={TYPE_COLORS[p.type]} />
                  <span className={`text-xs font-bold uppercase ${p.active ? ACTIVE_COLOR : INACTIVE_COLOR}`}>{p.active ? "active" : "inactive"}</span>
                </div>
              </div>
              <div className="flex gap-1 mt-2 md:mt-0">
                <button onClick={() => startEdit(p)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Edit</button>
                <button onClick={() => toggleActive(p)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">{p.active ? "Deactivate" : "Reactivate"}</button>
                <button onClick={() => remove(p.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="font-display text-xl uppercase">{editing ? "Edit partner" : "Add partner"}</h3>
        <form onSubmit={save} className="mt-4 grid gap-2">
          <FormField label="Name" id="pn" error={errors.name}>
            <input id="pn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
          </FormField>
          <FormField label="Link" id="pl" error={errors.link}>
            <input id="pl" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://example.com" className="border-[3px] border-ink px-3 py-2" />
          </FormField>
          <FormField label="Type" id="pt" error={errors.type}>
            <select id="pt" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PartnerType })} className="border-[3px] border-ink px-3 py-2">
              {["university", "community", "sponsor", "company"].map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t as PartnerType]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Order" id="po" error={errors.order}>
            <input id="po" type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
          </FormField>
          <div className="grid gap-1">
            <label htmlFor="pactive" className="text-xs font-bold uppercase">Active</label>
            <input id="pactive" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="border-[3px] border-ink" />
          </div>
          <FormField label="Logo (jpeg/png/webp, max 5MB)" id="pimg">
            <input id="pimg" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="border-[3px] border-ink px-3 py-2" />
            {logoFile && (
              <div className="mt-2">
                <p className="text-xs">{logoFile.name} ({Math.round(logoFile.size / 1024)} KB)</p>
                {logoPreview && <img src={logoPreview} alt="logo preview" className="h-24 w-24 object-cover border-[3px] border-ink mt-2" />}
                {uploadProgress != null && <p className="text-xs mt-1">Uploading {uploadProgress}%…</p>}
              </div>
            )}
            {!logoFile && editing && logoPreview && (
              <img src={logoPreview} alt="current logo" className="h-24 w-24 object-cover border-[3px] border-ink mt-2" />
            )}
          </FormField>
          {uploading ? (
            <button disabled className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white opacity-60">Saving…</button>
          ) : (
            <div className="flex gap-2">
              <button type="submit" className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{editing ? "Update partner" : "Create partner"}</button>
              <button type="button" onClick={resetForm} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">Cancel</button>
            </div>
          )}
          {err && <p className="mt-2 text-xs text-red">{err}</p>}
          {msg && <p className="mt-2 text-xs text-green">{msg}</p>}
        </form>
      </section>
    </div>
  );
}

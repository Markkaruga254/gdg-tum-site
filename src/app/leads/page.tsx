"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import BorderCard from "@/components/BorderCard";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/lib/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("role", "==", "lead")));
        setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser)));
      } catch { setError("Failed to load leads"); }
      finally { setLoading(false); }
    })();
  }, []);
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <h1 className="font-display text-4xl uppercase">Leads</h1>
        {loading && <p className="mt-4">Loading…</p>}
        {error && <p className="mt-4">{error}</p>}
        {!loading && leads.length === 0 && <p className="mt-4">No leads.</p>}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {leads.map((l) => (
            <BorderCard key={l.id} className="p-4">
              {l.photoUrl ? <img src={l.photoUrl} alt={l.name} className="h-24 w-24 object-cover border-[3px] border-ink" /> : <div className="h-24 w-24 border-[3px] border-ink bg-blue" />}
              <div className="mt-2 font-bold">{l.name}</div>
              <Tag label={l.track} color="blue" />
              {l.bio && <p className="mt-2 text-sm">{l.bio}</p>}
              {l.links?.map((ln) => <a key={ln.url} href={ln.url} className="block text-sm underline">{ln.title || ln.url}</a>)}
              <a href={`/lead?id=${l.id}`} className="mt-2 block text-sm underline">View profile →</a>
            </BorderCard>
          ))}
        </div>
      </main><Footer />
    </>
  );
}

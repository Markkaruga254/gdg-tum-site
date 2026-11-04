"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import BorderCard from "@/components/BorderCard";
import { getUsers, type AppUserWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";

export default function LeadsPage() {
  const [leads, setLeads] = useState<AppUserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    (async () => {
      try {
        const fetched = await getUsers("lead");
        setLeads(fetched);
      } catch {
        setError("Failed to load leads");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-4xl uppercase">Leads</h1>
        {loading && <p className="mt-4">Loading…</p>}
        {error && <p className="mt-4">{error}</p>}
        {!loading && leads.length === 0 && <p className="mt-4">No leads.</p>}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {leads.map((l) => (
            <BorderCard key={l.id} className="p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block w-6 h-6" style={{ backgroundColor: l.track }}></span>
                <div className="font-bold">{l.name}</div>
              </div>
              <Tag label={l.track} color={trackTagColor(l.track)} />
              {l.bio && <p className="mt-2 text-sm">{l.bio}</p>}
              {l.links?.map((ln) => (
                <a key={ln.url} href={ln.url} target="_blank" rel="noopener noreferrer" className="block text-sm underline">
                  {ln.title || ln.url}
                </a>
              ))}
              <a href={`/lead?id=${l.id}`} className="mt-2 block text-sm underline">
                View profile →
              </a>
            </BorderCard>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

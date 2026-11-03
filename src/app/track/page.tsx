"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import type { Track, Event, Writeup, AppUser } from "@/lib/types";

function View() {
  const params = useSearchParams();
  const slug = params.get("slug");
  const [track, setTrack] = useState<Track | null>(null);
  const [leads, setLeads] = useState<AppUser[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false); return; }
    (async () => {
      const tSnap = await getDocs(query(collection(db, "tracks"), where("slug", "==", slug)));
      if (!tSnap.empty) {
        const t = { id: tSnap.docs[0].id, ...tSnap.docs[0].data() } as Track;
        setTrack(t);
        const leadSnaps = await Promise.all(t.leadIds.map((id) => getDoc(doc(db, "users", id))));
        setLeads(leadSnaps.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() } as AppUser)));
        const evSnap = await getDocs(query(collection(db, "events"), where("trackId", "==", t.slug)));
        setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Event)));
        const wSnap = await getDocs(query(collection(db, "writeups"), where("status", "==", "published"), where("trackId", "==", t.slug)));
        setWriteups(wSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Writeup)));
      }
      setLoading(false);
    })();
  }, [slug]);
  if (loading) return <><Nav /><main className="p-6">Loading…</main><Footer /></>;
  if (!track) return <><Nav /><main className="p-6">Not found.</main><Footer /></>;
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <section className={`border-[3px] border-ink p-6 bg-${track.color} ${track.color === "blue" ? "text-white" : "text-ink"}`}>
          <h1 className="font-display text-4xl uppercase">{track.name}</h1>
          <p className="mt-2 text-sm">{track.description}</p>
        </section>
        <section className="mt-4">
          <h2 className="font-display text-2xl uppercase">Leads</h2>
          {leads.map((l) => <a key={l.id} href={`/lead?id=${l.id}`} className="block underline">{l.name}</a>)}
        </section>
        <section className="mt-4">
          <h2 className="font-display text-2xl uppercase">Events</h2>
          {events.map((e) => <a key={e.id} href={`/event?id=${e.id}`} className="block border-[3px] border-ink p-2 mt-2">{e.title} — {e.status}</a>)}
        </section>
        <section className="mt-4">
          <h2 className="font-display text-2xl uppercase">Writeups</h2>
          {writeups.map((w) => <a key={w.id} href={`/writeup?id=${w.id}`} className="block border-[3px] border-ink p-2 mt-2">{w.title}</a>)}
        </section>
      </main><Footer />
    </>
  );
}
export default function Page() { return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>; }

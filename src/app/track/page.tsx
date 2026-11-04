"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { getTrackBySlug, getUserById, getEvents, getWriteups, type TrackWithId, type EventWithId, type WriteupWithId, type AppUserWithId } from "@/lib/data";

function View() {
  const params = useSearchParams();
  const slug = params.get("slug");
  const [track, setTrack] = useState<TrackWithId | null>(null);
  const [leads, setLeads] = useState<AppUserWithId[]>([]);
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [writeups, setWriteups] = useState<WriteupWithId[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false); return; }
    (async () => {
      const t = await getTrackBySlug(slug as import("@/lib/types").TrackSlug);
      if (!t) { setLoading(false); return; }
      setTrack(t);
      let fetchedLeads: AppUserWithId[] = [];
      try {
        const leadSnaps = await Promise.all(t.leadIds.map((id) => getUserById(id)));
        fetchedLeads = leadSnaps.filter((s): s is AppUserWithId => s !== null);
      } catch {
        fetchedLeads = [];
      }
      setLeads(fetchedLeads);
      try {
        const fetchedEvents = await getEvents({ trackId: t.slug });
        setEvents(fetchedEvents.filter((e) => e.status !== "cancelled"));
      } catch {
        setEvents([]);
      }
      try {
        const fetchedWriteups = await getWriteups({ status: "published", trackId: t.slug });
        setWriteups(fetchedWriteups);
      } catch {
        setWriteups([]);
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

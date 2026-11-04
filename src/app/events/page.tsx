"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getEvents, type EventWithId } from "@/lib/data";

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [track, setTrack] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getEvents();
        setEvents(fetched);
      } catch {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = events.filter((e) => e.status !== "cancelled");
  const filtered = track === "all" ? visible : visible.filter((e) => e.trackId === track);

  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <h1 className="font-display text-4xl uppercase">Events</h1>
        <select aria-label="Filter by track" value={track} onChange={(e) => setTrack(e.target.value)} className="mt-4 border-[3px] border-ink px-3 py-2">
          <option value="all">All tracks</option>
          <option value="cloud">Cloud</option>
          <option value="cybersecurity">Cybersecurity</option>
          <option value="web">Web</option>
          <option value="women-in-tech">Women in Tech</option>
        </select>
        {loading && <p className="mt-4">Loading…</p>}
        {error && <p className="mt-4">{error}</p>}
        {!loading && filtered.length === 0 && <p className="mt-4">No events.</p>}
        <div className="mt-4 grid gap-4">
          {filtered.map((e) => (
            <a key={e.id} href={e.writeupId ? `/writeup?id=${e.writeupId}` : `/event?id=${e.id}`} className="block border-[3px] border-ink p-4">
              <div className="font-bold">{e.title}</div>
              <div className="text-sm">{e.status} · {e.venue}</div>
            </a>
          ))}
        </div>
      </main><Footer />
    </>
  );
}

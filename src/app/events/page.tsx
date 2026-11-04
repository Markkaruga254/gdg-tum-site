"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import { getEvents, type EventWithId } from "@/lib/data";

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [track, setTrack] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-4xl uppercase">Events</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setTrack("all")}
            className={`text-[12px] px-3 py-1 ${track === "all" ? "bg-yellow" : ""}`}
          >
            All
          </Button>
          {[...new Set(visible.map((e) => e.trackId))].map((t) => (
            <Button
              key={t}
              variant="outline"
              onClick={() => setTrack(t)}
              className={`text-[12px] px-3 py-1 ${track === t ? "bg-yellow" : ""}`}
            >
              {t}
            </Button>
          ))}
        </div>
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
      </main>
      <Footer />
    </>
  );
}

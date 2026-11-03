"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import NumberedRow from "@/components/NumberedRow";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Writeup, Track, TrackSlug } from "@/lib/types";

export default function WriteupsPage() {
  const [items, setItems] = useState<Writeup[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [track, setTrack] = useState<TrackSlug | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [w, t] = await Promise.all([
          getDocs(query(collection(db, "writeups"), where("status", "==", "published"), orderBy("publishedAt", "desc"))),
          getDocs(collection(db, "tracks")),
        ]);
        setItems(w.docs.map((d) => ({ id: d.id, ...d.data() } as Writeup)));
        setTracks(t.docs.map((d) => ({ id: d.id, ...d.data() } as Track)));
      } catch {
        setError("Failed to load writeups");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = track === "all" ? items : items.filter((w) => w.trackId === track);
  const trackColor = (slug: TrackSlug) => tracks.find((t) => t.slug === slug)?.color ?? "blue";

  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <h1 className="font-display text-4xl uppercase">Writeups</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setTrack("all")} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">All</button>
          {tracks.map((t) => (
            <button key={t.slug} onClick={() => setTrack(t.slug)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">{t.name}</button>
          ))}
        </div>
        {loading && <p className="mt-4">Loading…</p>}
        {error && <p className="mt-4">{error}</p>}
        {!loading && filtered.length === 0 && <p className="mt-4">No writeups.</p>}
        {filtered.map((w, i) => (
          <NumberedRow key={w.id} n={String(i + 1).padStart(2, "0")}>
            <a href={`/writeup?id=${w.id}`} className="font-bold">{w.title}</a>
            <p className="mt-1 text-sm">{w.summary}</p>
            <div className="mt-1 flex items-center gap-2">
              <Tag label={w.trackId} color={trackColor(w.trackId) as "blue" | "red" | "green" | "yellow"} />
              {w.aiDrafted && <span className="text-xs italic">Drafted with AI, reviewed by [author]</span>}
            </div>
          </NumberedRow>
        ))}
      </main><Footer />
    </>
  );
}

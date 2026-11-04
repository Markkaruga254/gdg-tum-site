"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import NumberedRow from "@/components/NumberedRow";
import { getTracks, getWriteups, type TrackWithId, type WriteupWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

export default function WriteupsPage() {
  const [items, setItems] = useState<WriteupWithId[]>([]);
  const [tracks, setTracks] = useState<TrackWithId[]>([]);
  const [track, setTrack] = useState<TrackSlug | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [w, t] = await Promise.all([getWriteups({ status: "published" }), getTracks()]);
        setItems(w);
        setTracks(t);
      } catch {
        setError("Failed to load writeups");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = track === "all" ? items : items.filter((w) => w.trackId === track);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-4xl uppercase">Writeups</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTrack("all")}
            className={`border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase ${track === "all" ? "bg-yellow" : ""}`}
          >
            All
          </button>
          {tracks.map((t) => (
            <button
              key={t.slug}
              onClick={() => setTrack(t.slug)}
              className={`border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase ${track === t.slug ? "bg-yellow" : ""}`}
            >
              {t.name}
            </button>
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
              <Tag label={w.trackId} color={trackTagColor(w.trackId)} />
              {w.aiDrafted && <span className="text-xs italic">Drafted with AI, reviewed by [author]</span>}
            </div>
          </NumberedRow>
        ))}
      </main>
      <Footer />
    </>
  );
}

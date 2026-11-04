"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getTracks, type TrackWithId } from "@/lib/data";
import { useEffect, useState } from "react";

export default function TracksPage() {
  const [tracks, setTracks] = useState<TrackWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const fetched = await getTracks();
        setTracks(fetched);
      } catch {
        setError("Failed to load tracks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-4xl uppercase">Tracks</h1>
        {loading && <p className="mt-4">Loading…</p>}
        {error && <p className="mt-4">{error}</p>}
        {!loading && tracks.length === 0 && <p className="mt-4">No tracks.</p>}
        <div className="mt-6 grid gap-4">
          {tracks.map((t) => (
            <div key={t.id} className="border-[3px] border-ink p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4" style={{ backgroundColor: t.color }}></span>
                <a href={`/track?slug=${t.slug}`} className="font-bold uppercase underline">
                  {t.name}
                </a>
              </div>
              <div className="text-sm mt-1">Lead: {t.leadIds.length ? t.leadIds.join(", ") : "[Lead]"}</div>
              <p className="mt-2 text-sm">{t.description}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

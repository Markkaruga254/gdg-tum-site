"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getTracks, getUsers, getWriteups, type AppUserWithId, type TrackWithId, type WriteupWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

const filters: { id: TrackSlug | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cloud", label: "Cloud" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "web", label: "Web" },
  { id: "women-in-tech", label: "Women in Tech" },
];

function publishedDate(writeup: WriteupWithId) {
  return writeup.publishedAt?.toDate().toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  }) || "Recently published";
}

export default function WriteupsPage() {
  const [items, setItems] = useState<WriteupWithId[]>([]);
  const [tracks, setTracks] = useState<TrackWithId[]>([]);
  const [authors, setAuthors] = useState<AppUserWithId[]>([]);
  const [track, setTrack] = useState<TrackSlug | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [writeups, fetchedTracks, fetchedAuthors] = await Promise.all([
          getWriteups({ status: "published" }),
          getTracks(),
          getUsers(),
        ]);
        setItems(writeups);
        setTracks(fetchedTracks);
        setAuthors(fetchedAuthors);
      } catch {
        setError("We could not load the writeups. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = track === "all" ? items : items.filter((item) => item.trackId === track);
  const trackNames = new Map(tracks.map((item) => [item.slug, item.name]));
  const authorNames = new Map(authors.map((author) => [author.id, author.name]));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Writeups</h1>
          <p className="mt-[14px] max-w-[620px] text-[17px] leading-[1.5]">
            What we did at each event, written by the leads who ran it.
          </p>
        </header>

        <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Filter writeups by track">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTrack(item.id)}
              aria-pressed={track === item.id}
              className={`border-r-[3px] border-ink px-[22px] py-[16px] text-[12px] font-bold uppercase ${track === item.id ? "bg-yellow" : "bg-white"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[18px] font-bold">{error}</p>}
        {loading ? (
          <p className="px-[26px] py-[24px] text-[13px] font-bold uppercase">Loading writeups…</p>
        ) : filtered.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[24px] text-[13px] font-bold uppercase">No published writeups in this track yet.</p>
        ) : (
          <div>
            {filtered.map((writeup, index) => (
              <article key={writeup.id} className={`grid grid-cols-[62px_minmax(0,1fr)] sm:grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-[16px] border-b-[3px] border-ink px-[20px] py-[20px] ${index % 4 === 1 ? "bg-yellow" : "bg-white"}`}>
                <span className="font-display text-[48px] leading-none sm:text-[58px]">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h2 className="text-[18px] font-bold leading-[1.2] sm:text-[21px]">
                    <a href={`/writeup?id=${writeup.id}`} className="underline-offset-4 hover:underline">{writeup.title}</a>
                  </h2>
                  <p className="mt-[7px] text-[12px] leading-[1.5]">
                    {publishedDate(writeup)} · By {authorNames.get(writeup.authorId) || "GDG TUM lead"}
                    {writeup.aiDrafted ? " · Drafted with AI, reviewed by lead" : ""}
                  </p>
                  <p className="mt-[9px] text-[13px] leading-[1.5]">{writeup.summary}</p>
                  <div className="mt-[10px]"><Tag label={trackNames.get(writeup.trackId) || writeup.trackId} color={trackTagColor(writeup.trackId)} /></div>
                </div>
                <a href={`/writeup?id=${writeup.id}`} className="col-start-2 mt-[2px] w-fit text-[12px] font-bold uppercase underline underline-offset-4 sm:col-start-auto sm:mt-0">Read ↗</a>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

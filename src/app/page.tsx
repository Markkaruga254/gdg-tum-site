"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import TickerBar from "@/components/TickerBar";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import SectionLabel from "@/components/SectionLabel";
import { getEvents, getWriteups, getPosts, getPartners, type EventWithId, type WriteupWithId, type PostWithId, type PartnerWithId } from "@/lib/data";
import { getGalleryPage, type Photo } from "@/lib/gallery";
import { TRACKS, TRACK_BG_COLORS, trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

export default function Home() {
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [writeups, setWriteups] = useState<WriteupWithId[]>([]);
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [partners, setPartners] = useState<PartnerWithId[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fetchedEvents = await getEvents({ orderAsc: true });
        setEvents(fetchedEvents);
        const fetchedWriteups = await getWriteups({ status: "published", limitCount: 3 });
        setWriteups(fetchedWriteups);
        try {
          const fetchedPosts = await getPosts();
          setPosts(fetchedPosts);
        } catch {
          setPosts([]);
        }
        try {
          const fetchedPartners = await getPartners();
          setPartners(fetchedPartners);
        } catch {
          // Partners non-critical
        }
        try {
          setMomentsLoading(true);
          const { photos: fetchedPhotos } = await getGalleryPage({ pageSize: 5 });
          setPhotos(fetchedPhotos);
        } catch {
          // Photos non-critical
        } finally {
          setMomentsLoading(false);
        }
      } catch (e) {
        console.error("Home: Firestore reads failed", e);
        const code = e instanceof Error && "code" in e ? String((e as { code: unknown }).code) : "unknown";
        setError(`read failed (${code}).`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const listed = events.filter((e) => e.status !== "cancelled");
  const nextEvent = listed.find((e) => e.status === "upcoming") || listed[0];
  const held = listed.filter((e) => e.status === "past").length;
  const activePartners = partners.filter((p) => p.active);

  return (
    <>
      <Nav />
      <TickerBar />
      <main className="mx-auto max-w-[1280px]">
        {error && (
          <section className="border-b-[3px] border-ink bg-red p-4 text-sm text-white">
            Events and writeups could not be loaded: {error}
          </section>
        )}
        <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-2">
          <div className="p-8">
            <h1 className="font-display text-5xl uppercase md:text-7xl">
              BUILD. LEARN. <span className="text-red">SHIP.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm">
              GDG on Campus TUM is a student developer club at the Technical University of Mombasa.
            </p>
            <a href="/tracks" className="mt-6 inline-block border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">
              Explore tracks →
            </a>
          </div>
          <div className="bg-blue p-8 text-white">
            <SectionLabel>Next event</SectionLabel>
            {loading ? (
              <p className="mt-4">Loading…</p>
            ) : error ? (
              <p className="mt-4">Event unavailable.</p>
            ) : nextEvent ? (
              <>
                <h2 className="mt-2 font-display text-2xl uppercase">{nextEvent.title}</h2>
                <p className="mt-1 text-sm">{nextEvent.venue}</p>
                <p className="mt-1 text-sm">{nextEvent.date?.toDate?.().toLocaleString?.()}</p>
                <button disabled className="mt-4 border-[3px] border-white px-4 py-2 font-bold uppercase opacity-60">
                  RSVP (soon)
                </button>
              </>
            ) : (
              <p className="mt-4">No upcoming events.</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 border-b-[3px] border-ink md:grid-cols-4">
          {[
            { label: "Events held", value: held },
            { label: "Writeups", value: writeups.length },
            { label: "Tracks", value: 4 },
            { label: "Members", value: "[N]" },
          ].map((s) => (
            <div key={s.label} className="border-r-[3px] border-ink p-6 last:border-r-0">
              <div className="font-display text-4xl">{s.value}</div>
              <div className="text-xs font-bold uppercase">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="border-b-[3px] border-ink p-6">
          <div className="flex flex-wrap gap-4">
            {posts.map((p) => (
              <a key={p.id} href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="border-[3px] border-ink p-4">
                <div className="font-bold">{p.title}</div>
                <div className="text-sm mt-1">{p.summary}</div>
              </a>
            ))}
          </div>
        </section>

        <section className="border-b-[3px] border-ink">
          <div className="px-[26px] py-[20px] border-b-[3px] border-ink flex justify-between items-center">
            <span className="font-bold uppercase text-[14px]">Who we work with</span>
            <span className="font-bold uppercase text-[12px]">Become a partner ↗</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {partners.map((p) => (
              <div key={p.id} className="min-h-[120px] flex flex-col items-center justify-center border-b-[3px] border-ink bg-[#FBBC04] p-2">
                <span className="font-bold uppercase text-[13px] text-ink">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="px-[26px] py-[20px] border-t-[3px] border-ink flex justify-between items-center">
            <span className="font-bold uppercase text-[14px]">Tracks</span>
            <a href="/tracks" className="border-[3px] border-ink px-[10px] py-[16px] font-bold uppercase text-[12px]">Explore tracks ↗</a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {TRACKS.map((t) => (
              <div key={t.slug} className="border-[3px] border-ink p-2 text-center">
                <a href={`/track?slug=${t.slug}`} className="block bg-[#FBBC04] p-4 text-ink font-bold uppercase">
                  {t.name}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b-[3px] border-ink">
          <div className="px-[26px] py-[20px] border-b-[3px] border-ink flex justify-between items-center">
            <h2 className="font-display text-[56px] uppercase">Moments</h2>
            <a href="/gallery" className="border-[3px] border-ink px-[10px] py-[16px] font-bold uppercase text-[12px]">Open the gallery ↗</a>
          </div>
          <div className="p-[20px] flex flex-wrap gap-[16px]">
            {photos.length === 0 && !momentsLoading ? (
              <p className="col-span-full text-center text-sm">Photos from our events will appear here.</p>
            ) : (
              photos.map((photo) => (
                <a key={photo.mediaId} href={`/writeup?id=${photo.writeupId}`} className="border-[3px] border-ink flex flex-col min-h-[240px]">
                  <div className="flex-1 relative overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.altText}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                        const wrapper = el.closest(".flex-1") as HTMLElement | null;
                        if (wrapper) {
                          wrapper.style.backgroundColor = TRACK_BG_COLORS[photo.trackId as import("@/lib/types").TrackSlug];
                        }
                      }}
                    />
                    <div className={`absolute inset-0`} style={{ backgroundColor: TRACK_BG_COLORS[photo.trackId as import("@/lib/types").TrackSlug] }} />
                  </div>
                  <div className="border-t-[3px] border-ink p-[10px]_[12px] text-[13px] font-bold bg-white">
                    {photo.caption}
                  </div>
                  <Tag label={photo.trackId} color={trackTagColor(photo.trackId)} />
                </a>
              ))
            )}
          </div>
          <div className="px-[0] py-[0]_[26px]_[20px] text-[12px] font-bold uppercase">Photos come from published writeups. Each links to its event.</div>
        </section>

        <section className="border-b-[3px] border-ink p-6">
          <p className="text-xs font-bold uppercase tracking-widest">Posts</p>
          <p className="mt-4">Loading…</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

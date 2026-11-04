"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import TickerBar from "@/components/TickerBar";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import SectionLabel from "@/components/SectionLabel";
import { getEvents, getWriteups, getPosts, getPartners, type EventWithId, type WriteupWithId, type PostWithId, type PartnerWithId } from "@/lib/data";
import { getGalleryPage, type Photo } from "@/lib/gallery";
import { TRACKS, TRACK_BG_COLORS, trackColor, trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

export default function Home() {
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [writeups, setWriteups] = useState<WriteupWithId[]>([]);
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
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
          setPostsLoading(true);
          const fetchedPosts = await getPosts();
          setPosts(fetchedPosts);
        } catch {
          setPosts([]);
          setPostsError("Failed to load posts.");
        } finally {
          setPostsLoading(false);
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
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const activeOrderedPartners = [...partners].filter((p) => p.active).sort((a, b) => a.order - b.order);
  const partnerTypes = [...new Set(activeOrderedPartners.map((p) => p.type))];
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
          <div className="flex justify-between items-center border-b-[3px] border-ink pb-2 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest">Latest writeups</p>
          </div>
          {writeups.length === 0 ? (
            <p className="text-sm">No writeups yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {writeups.map((w) => (
                <a key={w.id} href={`/writeup?id=${w.id}`} className="border-[3px] border-ink p-3">
                  <div className="font-bold">{w.title}</div>
                  <div className="text-sm mt-1">{w.summary}</div>
                  <Tag label={w.trackId} color={trackColor(w.trackId) as "blue" | "red" | "green" | "yellow"} />
                </a>
              ))}
            </div>
          )}
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
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className="border-[3px] border-ink px-[10px] py-[16px] font-bold uppercase text-[12px]">Become a partner ↗</a>
            ) : (
              <span className="border-[3px] border-ink px-[10px] py-[16px] font-bold uppercase text-[12px]">Become a partner ↗</span>
            )}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {activeOrderedPartners.map((p) => (
              <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer" className="block">
                <div className="min-h-[120px] flex flex-col items-center justify-center border-r-[3px] border-ink border-b-[3px] border-ink p-2">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt={p.name} className="object-contain max-h-[64px] mb-2" />
                  ) : (
                    <span className="font-bold uppercase text-[13px] text-ink">{p.name}</span>
                  )}
                  {p.type === "company" ? (
                    <span className="mt-2 inline-block border-[3px] border-ink px-2 py-0.5 text-xs font-bold uppercase bg-white text-ink">Company</span>
                  ) : (
                    <Tag
                      key={p.type}
                      label={p.type[0].toUpperCase() + p.type.slice(1)}
                      color={p.type === "university" ? "blue" : p.type === "community" ? "green" : "red"}
                    />
                  )}
                </div>
              </a>
            ))}
            <div key="placeholder" className="min-h-[120px] flex flex-col items-center justify-center border-[3px] border-ink bg-[#FBBC04] p-2">
              {contactEmail ? (
                <a href={`mailto:${contactEmail}`} className="font-bold uppercase text-[13px] text-ink">Your organisation here ↗</a>
              ) : (
                <span className="font-bold uppercase text-[13px] text-ink">Your organisation here ↗</span>
              )}
            </div>
          </div>
          {partnerTypes.length > 0 && (
            <div className="px-[26px] py-[4px] flex flex-wrap gap-2">
              {partnerTypes.map((t) => (
                <Tag
                  key={t}
                  label={t[0].toUpperCase() + t.slice(1)}
                  color={t === "university" ? "blue" : t === "community" ? "green" : t === "sponsor" ? "red" : "ink"}
                />
              ))}
            </div>
          )}
        </section>

        <section className="border-b-[3px] border-ink">
          <div className="px-[26px] py-[20px] border-b-[3px] border-ink flex justify-between items-center">
            <span className="font-bold uppercase text-[14px]">Tracks</span>
            <a href="/tracks" className="border-[3px] border-ink px-[10px] py-[16px] font-bold uppercase text-[12px]">Explore tracks ↗</a>
          </div>
          <h2 className="font-display text-3xl uppercase mt-4">Four tracks, one community</h2>
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
            {momentsLoading ? (
              <div className="border-[3px] border-ink rounded p-[20px] text-center w-full text-sm font-bold">Loading photos…</div>
            ) : photos.length === 0 ? (
              <p className="col-span-full text-center text-sm">Photos from our events will appear here.</p>
            ) : (
              <>
                <a
                  key={photos[0].mediaId}
                  href={`/writeup?id=${photos[0].writeupId}`}
                  className="border-[3px] border-ink flex flex-col flex-[2_1_340px] min-h-[440px]"
                >
                  <div className="flex-1 relative overflow-hidden">
                    <img
                      src={photos[0].url}
                      alt={photos[0].altText}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                        const wrapper = el.closest(".flex-1") as HTMLElement | null;
                        if (wrapper) {
                          wrapper.style.backgroundColor = TRACK_BG_COLORS[photos[0].trackId as import("@/lib/types").TrackSlug];
                        }
                      }}
                    />
                  </div>
                  <div className="border-t-[3px] border-ink p-[10px_12px] text-[13px] font-bold bg-white flex flex-col gap-1">
                    {photos[0].caption}
                    <Tag label={photos[0].trackId} color={trackTagColor(photos[0].trackId)} />
                  </div>
                </a>
                <div className="flex-[3_1_340px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[16px]">
                  {photos.slice(1, 5).map((photo) => (
                    <a
                      key={photo.mediaId}
                      href={`/writeup?id=${photo.writeupId}`}
                      className="border-[3px] border-ink flex flex-col min-h-[240px]"
                    >
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
                      </div>
                      <div className="border-t-[3px] border-ink p-[10px_12px] text-[13px] font-bold bg-white flex flex-col gap-1">
                        {photo.caption}
                        <Tag label={photo.trackId} color={trackTagColor(photo.trackId)} />
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="px-[0] py-[0_26px_20px] text-[12px] font-bold uppercase">Photos come from published writeups. Each links to its event.</div>
        </section>

        <section className="border-b-[3px] border-ink p-6">
          <div className="flex justify-between items-center border-b-[3px] border-ink pb-2 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest">Curated by GDG TUM Bot</p>
          </div>
          {postsLoading ? (
            <p className="text-sm">Loading…</p>
          ) : postsError ? (
            <p className="text-sm text-red">{postsError}</p>
          ) : posts.length === 0 ? (
            <p className="text-sm">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {posts.slice(0, 3).map((p) => (
                <a key={p.id} href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="border-[3px] border-ink p-4 flex flex-col">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.tags.map((tag) => (
                      <div key={tag} className="mb-1">
                        <Tag label={tag} color="ink" />
                      </div>
                    ))}
                  </div>
                  <div className="font-bold">{p.title}</div>
                  <div className="text-sm mt-1">{p.summary}</div>
                  <span className="mt-2 block text-sm underline">Source ↗</span>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

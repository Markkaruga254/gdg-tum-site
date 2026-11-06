"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import TickerBar from "@/components/TickerBar";
import Tag from "@/components/Tag";
import SectionHeader from "@/components/SectionHeader";
import StatBlock from "@/components/StatBlock";
import {
  getEvents,
  getWriteups,
  getPosts,
  getPartners,
  getTracks,
  getUsers,
  type EventWithId,
  type WriteupWithId,
  type PostWithId,
  type PartnerWithId,
  type TrackWithId,
  type AppUserWithId,
} from "@/lib/data";
import { getGalleryPage, type Photo } from "@/lib/gallery";
import { trackTagColor } from "@/lib/tracks";

const COLOR_CLASS: Record<string, string> = {
  blue: "bg-blue",
  red: "bg-red",
  green: "bg-green",
  yellow: "bg-yellow",
  ink: "bg-ink",
};

function formatDateTime(date: unknown): string {
  if (!date || typeof (date as { toDate: () => Date }).toDate !== "function") return "";
  const d = (date as { toDate: () => Date }).toDate();
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export default function Home() {
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [writeups, setWriteups] = useState<WriteupWithId[]>([]);
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [partners, setPartners] = useState<PartnerWithId[]>([]);
  const [tracks, setTracks] = useState<TrackWithId[]>([]);
  const [leads, setLeads] = useState<AppUserWithId[]>([]);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [partnersError, setPartnersError] = useState<string | null>(null);
  const [momentsError, setMomentsError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(true);
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
          setTracks(await getTracks());
        } catch {
          setTracksError("Tracks could not be loaded. Open the tracks page to retry.");
        }
        try {
          setLeads(await getUsers("lead"));
        } catch {
          setLeads([]);
        }
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
          setPartnersError("Partners could not be loaded.");
        }
        try {
          setMomentsLoading(true);
          const { photos: fetchedPhotos } = await getGalleryPage({ pageSize: 5 });
          setPhotos(fetchedPhotos);
        } catch {
          setMomentsError("Moments could not be loaded. Refresh the page to retry.");
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
  const nextEvent = listed.find((e) => e.status === "upcoming");
  const held = listed.filter((e) => e.status === "past").length;
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const activeOrderedPartners = [...partners].filter((p) => p.active).sort((a, b) => a.order - b.order);
  const trackOrder = ["cloud", "cybersecurity", "web", "women-in-tech"];
  const orderedTracks = [...tracks].sort((a, b) => trackOrder.indexOf(a.slug) - trackOrder.indexOf(b.slug));
  const partnerTypes = [...new Set(activeOrderedPartners.map((p) => p.type))];

  return (
    <>
      <Nav home />
      <TickerBar />
      <main className="mx-auto max-w-[1280px]">
        {error && (
          <section className="border-b-[3px] border-ink bg-red p-4 text-sm text-white">
            Events and writeups could not be loaded: {error}
          </section>
        )}

        {/* Hero + next event + stats */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] border-b-[3px] border-ink">
          <div className="px-[40px] py-[44px] border-r-[3px] border-ink">
            <h1 className="font-display font-normal text-[clamp(64px,9vw,128px)] leading-[.92] uppercase">
              Build.<br />
              Learn.<br />
              <span className="text-red">Ship.</span>
            </h1>
            <p className="text-[18px] leading-[1.5] max-w-[460px] mt-[26px]">
              Student developers at the Technical University of Mombasa, learning Google technologies by building real things together.
            </p>
            <a
              href="/tracks"
              className="mt-[26px] inline-block border-[3px] border-ink px-[22px] py-[12px] font-bold text-[13px] uppercase"
            >
              Explore tracks ↗
            </a>
          </div>
          <div className="flex flex-col">
            <div className={`bg-blue text-white px-[32px] py-[30px] border-b-[3px] border-ink flex-1`}>
              <SectionHeader className="tracking-[1px]">Next event</SectionHeader>
              {loading ? (
                <p className="mt-[12px] text-[15px]">Loading…</p>
              ) : nextEvent ? (
                <>
                  <h2 className="font-display text-[44px] leading-[1.05] uppercase mt-[12px]">{nextEvent.title}</h2>
                  <p className="text-[15px] mt-[4px]">{formatDateTime(nextEvent.date)} · {nextEvent.venue}</p>
                  <button type="button" disabled className="mt-[18px] w-fit cursor-not-allowed border-[3px] border-ink bg-white px-[18px] py-[10px] text-[12px] font-bold uppercase opacity-60">
                    RSVP · Coming soon
                  </button>
                </>
              ) : (
                <p className="mt-[12px] text-[15px]">No upcoming events.</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-[18px] p-[18px] border-t-[3px] border-ink">
              <StatBlock value={held} label="Events held" />
              <StatBlock value={writeups.length} label="Writeups" />
              <StatBlock value={tracks.length} label="Tracks" />
            </div>
          </div>
        </section>

        {/* Latest writeups (numbered rows, row 2 red) */}
        <section id="writeups" className="grid grid-cols-[minmax(160px,1fr)_3fr] border-b-[3px] border-ink">
          <div className="px-[24px] py-[28px] border-r-[3px] border-ink flex flex-col justify-between gap-[20px]">
            <div>
              <SectionHeader className="text-[14px]">Latest writeups</SectionHeader>
              <a href="/writeups" className="text-[12px] font-bold uppercase">
                See all ↗
              </a>
            </div>
          </div>
          <div>
            {writeups.length === 0 ? (
              <div className="px-[24px] py-[18px]">No writeups yet.</div>
            ) : (
              writeups.slice(0, 3).map((w, i) => {
                const num = String(i + 1).padStart(2, "0");
                const isRed = i === 1;
                return (
                  <div
                    key={w.id}
                    className={`grid grid-cols-[90px_1fr_auto] gap-[18px] px-[24px] py-[18px] items-center border-b-[3px] border-ink ${isRed ? "bg-red" : ""}`}
                  >
                    <span className="font-display text-[64px] leading-1">{num}</span>
                    <div>
                      <a href={`/writeup?id=${w.id}`} className="font-bold text-[20px] underline-offset-4 hover:underline">{w.title}</a>
                      <div className="text-[12px] mt-[4px] text-[#444]">
                        {w.aiDrafted ? "Drafted with AI · reviewed by lead" : "Published by a track lead"}
                      </div>
                    </div>
                    <Tag label={w.trackId === "women-in-tech" ? "Women in Tech" : w.trackId.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} color={isRed ? "ink" : trackTagColor(w.trackId)} />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Tracks block */}
        <section id="tracks" className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-b-[3px] border-ink">
          <div className="px-[32px] py-[36px] border-r-[3px] border-ink bg-yellow">
            <h2 className="font-display font-normal text-[72px] leading-[.95] uppercase">
              Four<br />
              tracks.<br />
              One<br />
              club.
            </h2>
            <p className="text-[15px] leading-[1.5] mt-[18px]">
              Each track is led by a student lead who runs sessions, posts writeups and builds a public portfolio.
            </p>
          </div>
          <div>
            {tracksError && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] text-[12px] font-bold uppercase">{tracksError}</p>}
            {tracks.length === 0 ? (
              <div className="px-[26px] py-[22px] border-b-[3px] border-ink">No tracks yet.</div>
            ) : (
              orderedTracks.map((t, i) => {
                const trackLeads = leads.filter((lead) => t.leadIds.includes(lead.id));
                const last = i === tracks.length - 1;
                const isYellow = t.color === "yellow";
                return (
                  <a
                    key={t.id}
                    href={`/track?slug=${t.slug}`}
                    className={`flex items-center justify-between gap-[16px] border-ink px-[26px] py-[18px] hover:bg-yellow ${!last ? "border-b-[3px]" : ""}`}
                  >
                    <span className="flex min-w-0 items-center gap-[12px]">
                      <span className={`inline-block h-[14px] w-[14px] shrink-0 ${COLOR_CLASS[t.color]} ${isYellow ? "border-[2px] border-ink" : ""}`}></span>
                      <span className="min-w-0">
                        <span className="block text-[19px] font-bold">{String(i + 1).padStart(2, "0")} · {t.name}</span>
                        <span className="mt-[4px] block text-[11px] uppercase">{trackLeads.map((lead) => lead.name).join(", ") || "Lead to be announced"}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-[28px]">↗</span>
                  </a>
                );
              })
            )}
          </div>
        </section>

        {/* Partners */}
        <section id="partners" className="border-b-[3px] border-ink">
          {partnersError && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[14px] text-[12px] font-bold uppercase">{partnersError}</p>}
          <div className="flex justify-between items-center flex-wrap gap-[10px] px-[26px] py-[20px] border-b-[3px] border-ink">
            <SectionHeader className="text-[14px]">Who we work with</SectionHeader>
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className="text-[12px] font-bold uppercase">
                Become a partner ↗
              </a>
            ) : (
              <span className="text-[12px] font-bold uppercase">Become a partner ↗</span>
            )}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {activeOrderedPartners.map((p) => (
              <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer" className="block">
                <div className="min-h-[120px] flex flex-col items-center justify-center border-r-[3px] border-ink border-b-[3px] border-ink p-[2px]">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt={p.name} className="object-contain max-h-[64px] mb-[2px]" />
                  ) : (
                    <span className="font-bold text-[13px] text-ink uppercase">{p.name}</span>
                  )}
                  {p.type === "company" ? (
                    <span className="mt-[2px] inline-block border-[3px] border-ink px-[2px] py-[0.5px] text-[10px] font-bold uppercase bg-white text-ink">
                      Company
                    </span>
                  ) : (
                    <Tag
                      label={p.type[0].toUpperCase() + p.type.slice(1)}
                      color={p.type === "university" ? "blue" : p.type === "community" ? "green" : "red"}
                    />
                  )}
                </div>
              </a>
            ))}
            <div key="placeholder" className="min-h-[120px] flex flex-col items-center justify-center border-[3px] border-ink bg-[#FBBC04] p-[2px]">
              {contactEmail ? (
                <a href={`mailto:${contactEmail}`} className="font-bold text-[13px] text-ink uppercase">Your organisation here ↗</a>
              ) : (
                <span className="font-bold text-[13px] text-ink uppercase">Your organisation here ↗</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-[10px] px-[26px] py-[14px]">
            {partnerTypes.map((t) => (
              <Tag
                key={t}
                label={t[0].toUpperCase() + t.slice(1)}
                color={t === "university" ? "blue" : t === "community" ? "green" : "red"}
              />
            ))}
          </div>
        </section>

        {/* Moments */}
        <section id="moments" className="border-b-[3px] border-ink">
          {momentsError && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[14px] text-[12px] font-bold uppercase">{momentsError}</p>}
          <div className="flex justify-between items-center flex-wrap gap-[10px] px-[26px] py-[20px] border-b-[3px] border-ink">
            <h2 className="font-display font-normal text-[56px] uppercase mt-0">Moments</h2>
            <a
              href="/gallery"
              className="border-[3px] border-ink px-[16px] py-[10px] font-bold text-[12px] uppercase"
            >
              Open the gallery ↗
            </a>
          </div>
          <div className="flex flex-wrap gap-[16px] p-[20px]">
            {momentsLoading ? (
              <div className="border-[3px] border-ink text-center text-[12px] font-bold">Loading photos…</div>
            ) : photos.length === 0 ? (
              <p className="col-span-full text-center text-[12px] font-bold uppercase">
                Photos from our events will appear here.
              </p>
            ) : (
              <>
                <a
                  href={`/writeup?id=${photos[0].writeupId}`}
                  className="border-[3px] border-ink flex flex-col flex-[2_1_340px] min-h-[440px]"
                >
                  <div className="flex-1 relative overflow-hidden">
                    <img src={photos[0].url} alt={photos[0].altText} className="w-full h-full object-cover" />
                  </div>
                  <div className="border-t-[3px] border-ink px-[12px] py-[10px] text-[13px] font-bold bg-white flex flex-col gap-1">
                    {photos[0].caption} &middot;{" "}
                    <Tag label={photos[0].trackId === "women-in-tech" ? "Women in Tech" : photos[0].trackId.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} color={trackTagColor(photos[0].trackId)} />
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
                        <img src={photo.url} alt={photo.altText} className="w-full h-full object-cover" />
                      </div>
                      <div className="border-t-[3px] border-ink px-[12px] py-[10px] text-[13px] font-bold bg-white flex flex-col gap-1">
                        {photo.caption}
                        <Tag label={photo.trackId === "women-in-tech" ? "Women in Tech" : photo.trackId.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} color={trackTagColor(photo.trackId)} />
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="px-[26px] pt-0 pb-[20px] text-[12px] font-bold uppercase">
            Photos come from published writeups. Each links to its event.
          </div>
        </section>

        {/* Blog preview */}
        <section id="blog" className="border-b-[3px] border-ink">
          <div className="flex justify-between items-center flex-wrap gap-[10px] p-[20px] p-[26px] border-b-[3px] border-ink">
            <SectionHeader className="text-[14px]">Tech blog</SectionHeader>
            <span className="bg-ink text-white px-[10px] py-[4px] text-[12px] font-bold uppercase">
              Curated by GDG TUM Bot
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            {posts.filter((post) => post.hidden !== true).slice(0, 3).map((post, index) => (
              <article key={post.id} className={`border-r-[3px] border-b-[3px] border-ink p-[24px] ${index === 1 ? "bg-yellow" : "bg-white"}`}>
                <Tag label={post.tags?.[0] || "News"} color="green" />
                <h3 className="mt-[16px] text-[20px] font-bold leading-[1.25]">{post.title}</h3>
                <p className="mt-[8px] text-[14px] leading-[1.5] text-[#333]">{post.summary}</p>
                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-[14px] inline-block text-[12px] font-bold uppercase underline">Source ↗</a>
              </article>
            ))}
            {!postsLoading && posts.filter((post) => post.hidden !== true).length === 0 && (
              <p className="px-[24px] py-[22px] text-[12px] font-bold uppercase">No articles have been published yet.</p>
            )}
            {postsLoading && <p className="px-[24px] py-[22px] text-[12px] font-bold uppercase">Loading articles…</p>}
            {postsError && <p role="alert" className="bg-red px-[24px] py-[22px] text-[12px] font-bold uppercase">{postsError}</p>}
          </div>
        </section>

        {/* Labs Soon + red digest */}
        <section id="labs" className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-b-[3px] border-ink">
          <div className="px-[32px] py-[34px] border-r-[3px] border-ink bg-ink text-white flex flex-col gap-[12px]">
            <Tag label="Soon" color="yellow" />
            <h2 className="font-display font-normal text-[64px] leading-[1.1] uppercase mb-[8px]">Labs</h2>
            <p className="text-[16px] leading-[1.6] mt-[8px]">Where students upskill with hands-on, guided practice.</p>
          </div>
          <div id="join" className="px-[32px] py-[34px] bg-red flex flex-col gap-[22px]">
            <h2 className="font-display font-normal text-[44px] leading-[1.1] uppercase mb-[14px]">
              Get the weekly digest
            </h2>
            <div className="flex flex-wrap border-[3px] border-ink bg-white gap-[18px]">
              <label htmlFor="em" className="sr-only">
                Email
              </label>
              <input
                id="em"
                type="email"
                placeholder="ENTER YOUR EMAIL"
                disabled
                className="flex-1 min-w-[160px] border-0 px-[16px] py-[16px] text-[14px] font-bold bg-transparent focus:outline-none"
              />
              <button type="button" disabled className="bg-ink text-white border-0 px-[26px] py-[16px] text-[14px] font-bold uppercase">
                Coming soon
              </button>
            </div>
          </div>
        </section>

        {/* Footer strip */}
        <footer className="flex flex-wrap justify-between gap-[12px] px-[26px] py-[16px] text-[12px] font-bold uppercase">
          <span>&copy; 2026 GDG on Campus TUM</span>
          <span>GitHub &middot; LinkedIn &middot; Instagram &middot; X</span>
        </footer>
      </main>
    </>
  );
}

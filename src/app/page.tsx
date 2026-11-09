"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PartnerCell from "@/components/PartnerCell";
import { PhotoImage } from "@/components/PhotoCard";
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

function postTagColor(tag: string): "blue" | "red" | "green" | "yellow" | "ink" {
  const value = tag.toLowerCase();
  if (value.includes("cloud")) return "blue";
  if (value.includes("cyber") || value.includes("security")) return "red";
  if (value.includes("ai") || value.includes("ml")) return "yellow";
  if (value.includes("devops")) return "ink";
  return "green";
}

function formatDateTime(date: unknown): string {
  if (!date || typeof (date as { toDate: () => Date }).toDate !== "function") return "";
  const d = (date as { toDate: () => Date }).toDate();
  return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString(undefined, { month: "short" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
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
    let active = true;
    const load = async () => {
      const results = await Promise.allSettled([
        getEvents({ orderAsc: true }),
        getWriteups({ status: "published", limitCount: 3 }),
        getTracks(),
        getUsers("lead"),
        getPosts(),
        getPartners(),
        getGalleryPage({ pageSize: 5 }),
      ]);
      if (!active) return;

      const [eventsResult, writeupsResult, tracksResult, leadsResult, postsResult, partnersResult, momentsResult] = results;

      if (eventsResult.status === "fulfilled") setEvents(eventsResult.value);
      else setError("Events could not be loaded.");

      if (writeupsResult.status === "fulfilled") setWriteups(writeupsResult.value);
      else setError("Writeups could not be loaded.");

      if (tracksResult.status === "fulfilled") setTracks(tracksResult.value);
      else setTracksError("Tracks could not be loaded. Open the tracks page to retry.");

      if (leadsResult.status === "fulfilled") setLeads(leadsResult.value);
      else setLeads([]);

      if (postsResult.status === "fulfilled") setPosts(postsResult.value);
      else {
        setPosts([]);
        setPostsError("Failed to load posts.");
      }

      if (partnersResult.status === "fulfilled") setPartners(partnersResult.value);
      else setPartnersError("Partners could not be loaded.");

      if (momentsResult.status === "fulfilled") setPhotos(momentsResult.value.photos);
      else setMomentsError("Moments could not be loaded. Refresh the page to retry.");

      setPostsLoading(false);
      setMomentsLoading(false);
      setLoading(false);
    };

    void load();
    return () => { active = false; };
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
            Some homepage content could not be loaded: {error}
          </section>
        )}

        {/* Hero + next event + stats */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] border-b-[3px] border-ink">
          <div className="border-b-[3px] border-ink px-[20px] py-[28px] xl:border-b-0 xl:border-r-[3px] xl:px-[40px] xl:py-[44px]">
            <h1 className="font-display font-normal text-[72px] leading-[.92] uppercase xl:text-[clamp(64px,9vw,128px)]">
              Build.<br />
              Learn.<br />
              <span className="text-red">Ship.</span>
            </h1>
            <p className="mt-[18px] max-w-[460px] text-[16px] leading-[1.5] xl:mt-[26px] xl:text-[18px]">
              Student developers at the Technical University of Mombasa, learning Google technologies by building real things together.
            </p>
            <a
              href="/tracks"
              className="mt-[18px] inline-block border-[3px] border-ink px-[22px] py-[12px] text-[12px] font-bold uppercase xl:mt-[26px] xl:text-[13px]"
            >
              Explore tracks ↗
            </a>
          </div>
          <div className="flex flex-col">
            <div className={`bg-blue text-white px-[20px] py-[24px] border-b-[3px] border-ink flex-1 xl:px-[32px] xl:py-[30px]`}>
              <SectionHeader className="tracking-[1px]">Next event</SectionHeader>
              {loading ? (
                <p className="mt-[12px] text-[15px]">Loading…</p>
              ) : nextEvent ? (
                <>
                  <h2 className="font-display text-[38px] leading-[1.05] uppercase mt-[10px] xl:mt-[12px] xl:text-[44px]">{nextEvent.title}</h2>
                  <p className="mt-[4px] text-[14px] xl:text-[15px]">{formatDateTime(nextEvent.date)} · {nextEvent.venue}</p>
                  <button type="button" disabled className="mt-[18px] w-fit cursor-not-allowed border-[3px] border-ink bg-white px-[18px] py-[10px] text-[12px] font-bold uppercase text-ink opacity-60">
                    RSVP (coming soon)
                  </button>
                </>
              ) : (
                <p className="mt-[12px] text-[15px]">No upcoming events.</p>
              )}
            </div>
            <div className="grid grid-cols-3">
              <StatBlock value={held} label="Events held" />
              <StatBlock value={writeups.length} label="Writeups" />
              <StatBlock value={tracks.length} label="Tracks" />
            </div>
          </div>
        </section>

        {/* Latest writeups */}
        <section id="writeups" className="border-b-[3px] border-ink">
          <div className="flex flex-wrap items-center justify-between gap-[10px] border-y-[3px] border-ink px-[22px] py-[16px]">
            <SectionHeader className="text-[14px]">Latest writeups</SectionHeader>
            <a href="/writeups" className="hidden text-[12px] font-bold uppercase tracking-[.5px] xl:inline">See all ↗</a>
          </div>
          {writeups.length === 0 ? (
            <p className="px-[22px] py-[18px] text-[13px] font-bold uppercase">No writeups yet.</p>
          ) : (
            writeups.slice(0, 3).map((w, i) => {
              const num = String(i + 1).padStart(2, "0");
              const isRed = i === 1;
              const trackLabel = w.trackId === "women-in-tech" ? "Women in Tech" : w.trackId.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
              const publishedDate = w.publishedAt?.toDate
                ? w.publishedAt.toDate().toLocaleDateString(undefined, { day: "numeric", month: "short" })
                : "";
              return (
                <article
                  key={w.id}
                  className={"grid grid-cols-[44px_minmax(0,1fr)] items-center gap-[12px] border-b-[3px] border-ink px-[20px] py-[16px] xl:grid-cols-[90px_minmax(0,1fr)_auto] xl:gap-[14px] xl:px-[22px] xl:py-[14px] " + (isRed ? "bg-red" : "bg-white") + (i === 2 ? " border-b-0" : "")}
                >
                  <span className="font-display text-[44px] leading-none xl:text-[56px]">{num}</span>
                  <div className="min-w-0">
                    <a href={"/writeup?id=" + w.id} className="text-[17px] font-bold underline-offset-4 hover:underline xl:text-[19px]">{w.title}</a>
                    <p className="mt-[4px] hidden text-[12px] xl:block">
                      {publishedDate}{publishedDate ? " · " : ""}
                      {w.aiDrafted ? "Drafted with AI, reviewed by the lead" : trackLabel + " Track"}
                    </p>
                  </div>
                  <div className="col-start-2 flex flex-wrap items-center gap-[10px] xl:col-start-auto">
                    <Tag label={trackLabel} color={trackTagColor(w.trackId)} />
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Tracks block */}
        <section id="tracks" className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-b-[3px] border-ink">
          <div className="bg-yellow px-[20px] py-[26px] xl:border-r-[3px] xl:px-[32px] xl:py-[36px]">
            <h2 className="block font-display text-[56px] font-normal uppercase leading-[.95] xl:hidden">Four tracks. One club.</h2>
            <h2 className="hidden font-display text-[72px] font-normal uppercase leading-[.95] xl:block">Four<br />tracks.<br />One<br />club.</h2>
            <p className="mt-[18px] hidden text-[15px] leading-[1.5] xl:block">
              Each track is led by a student lead who runs sessions, posts writeups and builds a public portfolio.
            </p>
          </div>
          <div>
            {tracksError && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] text-[12px] font-bold uppercase">{tracksError}</p>}
            {tracks.length === 0 ? (
              <div className="px-[26px] py-[22px] border-b-[3px] border-ink">No tracks yet.</div>
            ) : (
              orderedTracks.map((t, i) => {
                const trackLeads = leads.filter((lead) => lead.track === t.slug);
                const last = i === tracks.length - 1;
                const isYellow = t.color === "yellow";
                return (
                  <a
                    key={t.id}
                    href={`/track?slug=${t.slug}`}
                    className={`flex items-center justify-between gap-[16px] border-t-[3px] border-ink px-[20px] py-[18px] hover:bg-yellow xl:border-t-0 xl:px-[26px] xl:py-[22px] ${!last ? "xl:border-b-[3px]" : ""}` }
                  >
                    <span className="flex min-w-0 items-center gap-[12px]">
                      <span className={`inline-block h-[14px] w-[14px] shrink-0 ${COLOR_CLASS[t.color]} ${isYellow ? "border-[2px] border-ink" : ""}`}></span>
                      <span className="min-w-0">
                        <span className="block text-[18px] font-bold xl:hidden">{t.name}</span>
                        <span className="hidden text-[22px] font-bold xl:block">{String(i + 1).padStart(2, "0")} · {t.name}</span>
                        <span className="mt-[4px] hidden text-[11px] uppercase xl:block">{trackLeads.map((lead) => lead.name).join(", ") || "Lead to be announced"}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-[28px] xl:hidden">+</span>
                    <span className="hidden shrink-0 text-[28px] xl:inline">↗</span>
                  </a>
                );
              })
            )}
          </div>
        </section>

        {/* Partners */}
        <section id="partners" className="border-b-[3px] border-ink">
          {partnersError && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[14px] text-[12px] font-bold uppercase">{partnersError}</p>}
          <div className="flex justify-between items-center flex-wrap gap-[10px] px-[22px] py-[16px] border-b-[3px] border-ink">
            <SectionHeader className="text-[14px]">Who we work with</SectionHeader>
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className="hidden text-[12px] font-bold uppercase xl:inline">
                Become a partner ↗
              </a>
            ) : (
              <span className="hidden text-[12px] font-bold uppercase xl:inline">Become a partner ↗</span>
            )}
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {activeOrderedPartners.map((partner) => (
              <PartnerCell
                key={partner.id}
                name={partner.name}
                logoUrl={partner.logoUrl}
                link={partner.link}
                type={partner.type}
              />
            ))}
            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="flex min-h-[110px] flex-col items-center justify-center border-r-0 border-b-[3px] border-ink bg-yellow p-[20px] text-center text-[13px] font-bold uppercase"
              >
                Your organisation here ↗
              </a>
            ) : (
              <div className="flex min-h-[110px] flex-col items-center justify-center border-r-0 border-b-[3px] border-ink bg-yellow p-[20px] text-center text-[13px] font-bold uppercase">
                Your organisation here ↗
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-[10px] px-[26px] py-[14px]">
            {partnerTypes.map((t) => (
              <Tag
                key={t}
                label={t[0].toUpperCase() + t.slice(1)}
                color={t === "university" ? "blue" : t === "community" ? "green" : t === "sponsor" ? "red" : "white"}
                bordered={t === "company"}
              />
            ))}
          </div>
        </section>

        {/* Moments */}
        <section id="moments" className="border-b-[3px] border-ink">
          {momentsError && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[14px] text-[12px] font-bold uppercase">{momentsError}</p>}
          <div className="flex justify-between items-center flex-wrap gap-[10px] px-[22px] py-[16px] border-b-[3px] border-ink">
            <h2 className="font-display font-normal text-[44px] uppercase mt-0 xl:text-[56px]">Moments</h2>
            <a
              href="/gallery"
              className="hidden border-[3px] border-ink px-[16px] py-[10px] font-bold text-[12px] uppercase xl:inline-block"
            >
              Open the gallery ↗
            </a>
          </div>
          <div className="flex flex-wrap gap-[14px] p-[16px] xl:gap-[16px] xl:p-[20px]">
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
                  className="flex h-full min-h-[240px] flex-[2_1_340px] flex-col border-[3px] border-ink xl:min-h-[440px]"
                >
                  <PhotoImage url={photos[0].url} altText={photos[0].altText} trackId={photos[0].trackId} className="h-[200px] overflow-hidden border-b-[3px] border-ink xl:h-[380px]" />
                  <div className="border-t-[3px] border-ink px-[12px] py-[10px] text-[13px] font-bold bg-white flex flex-col gap-1">
                    {photos[0].caption} &middot;{" "}
                    <Tag label={photos[0].trackId === "women-in-tech" ? "Women in Tech" : photos[0].trackId.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} color={trackTagColor(photos[0].trackId)} />
                  </div>
                </a>
                <div className="flex-[3_1_340px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[16px]">
                  {photos.slice(1, 5).map((photo, index) => (
                    <a
                      key={photo.mediaId}
                      href={`/writeup?id=${photo.writeupId}`}
                      className={`flex h-full min-h-[160px] flex-col border-[3px] border-ink xl:min-h-[240px] ${index > 1 ? "hidden xl:flex" : ""}`}
                    >
                      <PhotoImage url={photo.url} altText={photo.altText} trackId={photo.trackId} className="h-[110px] overflow-hidden border-b-[3px] border-ink xl:h-[150px]" />
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
          <div className="flex justify-between items-center flex-wrap gap-[10px] px-[22px] py-[16px] border-b-[3px] border-ink">
            <SectionHeader className="text-[14px]">Tech blog</SectionHeader>
            <span className="hidden bg-ink px-[10px] py-[4px] text-[12px] font-bold uppercase text-white xl:inline-block">
              Curated by GDG TUM Bot
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[14px] p-[16px] xl:gap-[16px] xl:p-[20px]">
            {posts.filter((post) => post.hidden !== true).slice(0, 3).map((post, index) => (
              <article key={post.id} className={`border-[3px] border-ink bg-white p-[22px] ${index > 1 ? "hidden xl:block" : ""}`}>
                <Tag label={post.tags?.[0] || "News"} color={postTagColor(post.tags?.[0] || "News")} />
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
          <div className="flex flex-col gap-[12px] border-b-[3px] border-ink bg-ink px-[28px] py-[34px] text-white xl:border-b-0 xl:border-r-[3px] xl:px-[32px]">
            <Tag label="Soon" color="yellow" />
            <h2 className="font-display font-normal text-[64px] leading-[1.1] uppercase mb-[8px]">Labs</h2>
            <p className="text-[16px] leading-[1.6] mt-[8px]">Where students upskill with hands-on, guided practice.</p>
          </div>
          <div id="join" className="flex flex-col gap-[22px] bg-red px-[26px] py-[30px] xl:px-[32px] xl:py-[34px]">
            <h2 className="font-display font-normal text-[44px] leading-[1.1] uppercase mb-[14px]">
              Get the weekly digest
            </h2>
            <div className="flex flex-wrap border-[3px] border-ink bg-white">
              <label htmlFor="em" className="sr-only">
                Email
              </label>
              <input
                id="em"
                type="email"
                placeholder="ENTER YOUR EMAIL"
                disabled
                className="min-w-[140px] flex-1 border-0 bg-transparent px-[14px] py-[14px] text-[13px] font-bold focus:outline-none"
              />
              <button type="button" disabled className="border-0 bg-ink px-[20px] py-[14px] text-[13px] font-bold uppercase text-white">
                Coming soon
              </button>
            </div>
          </div>
        </section>

        {/* Footer strip */}
        <Footer borderTop={false} />
      </main>
    </>
  );
}

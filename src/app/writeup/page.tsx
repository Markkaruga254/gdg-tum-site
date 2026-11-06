"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getWriteupById, getUserById, getWriteups, getMediaByWriteup, getEventById, type WriteupWithId, type AppUserWithId, type MediaWithId, type EventWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";

function trackLabel(track: string) {
  return track === "women-in-tech" ? "Women in Tech" : track[0].toUpperCase() + track.slice(1);
}

function View() {
  const params = useSearchParams();
  const id = params.get("id");
  const [writeup, setWriteup] = useState<WriteupWithId | null>(null);
  const [author, setAuthor] = useState<AppUserWithId | null>(null);
  const [event, setEvent] = useState<EventWithId | null>(null);
  const [related, setRelated] = useState<WriteupWithId[]>([]);
  const [media, setMedia] = useState<MediaWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const current = await getWriteupById(id);
        if (!active) return;
        setWriteup(current);
        if (!current) return;
        const [authorResult, relatedResults, eventResult, mediaResults] = await Promise.all([
          current.authorId ? getUserById(current.authorId).catch(() => null) : Promise.resolve(null),
          getWriteups({ status: "published", trackId: current.trackId }).catch(() => []),
          current.eventId ? getEventById(current.eventId).catch(() => null) : Promise.resolve(null),
          getMediaByWriteup(current.id).catch(() => []),
        ]);
        if (!active) return;
        setAuthor(authorResult);
        setRelated(relatedResults.filter((item) => item.id !== current.id).slice(0, 3));
        setEvent(eventResult);
        setMedia(mediaResults);
      } catch {
        if (active) setError("The writeup could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading writeup…</main><Footer /></>;
  if (!writeup) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[56px] uppercase">Writeup not found</h1><a href="/writeups" className="mt-4 inline-block underline">Back to writeups</a></main><Footer /></>;

  const date = writeup.publishedAt?.toDate().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) || "Recently published";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <Tag label={trackLabel(writeup.trackId)} color={trackTagColor(writeup.trackId)} />
            {writeup.aiDrafted && <Tag label={`Drafted with AI, reviewed by ${author?.name || "the lead"}`} color="ink" />}
          </div>
          <h1 className="mt-[16px] max-w-[1000px] font-display text-[clamp(52px,7vw,96px)] uppercase leading-[.94]">{writeup.title}</h1>
          <p className="mt-[18px] text-[13px] font-bold uppercase">
            By {author ? <a href={`/lead?id=${author.id}`} className="underline">{author.name}</a> : "GDG TUM lead"} · {date}
            {event ? <> · <a href={`/event?id=${event.id}`} className="underline">{event.title}</a></> : null}
          </p>
        </header>
        <section className="border-b-[3px] border-ink bg-yellow px-[26px] py-[24px]">
          <p className="max-w-[860px] text-[19px] font-medium leading-[1.5]">{writeup.summary}</p>
        </section>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] font-bold">{error}</p>}

        <section className="max-w-[872px] px-[26px] py-[34px]">
          <h2 className="mb-[10px] font-display text-[34px] uppercase">What we covered</h2>
          <div className="space-y-[16px] text-[17px] leading-[1.7] [&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:font-display [&_h1]:text-4xl [&_h1]:uppercase [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-[34px] [&_h2]:uppercase [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-bold [&_li]:ml-6 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:underline [&_blockquote]:border-l-[3px] [&_blockquote]:border-ink [&_blockquote]:pl-4 [&_pre]:overflow-x-auto [&_pre]:border-[3px] [&_pre]:border-ink [&_pre]:bg-[#f5f5f5] [&_pre]:p-4 [&_code]:font-mono [&_hr]:my-6 [&_hr]:border-ink">
            <ReactMarkdown>{writeup.body}</ReactMarkdown>
          </div>
          <h2 className="mb-[10px] mt-[28px] font-display text-[34px] uppercase">Resources</h2>
          {writeup.links?.length ? (
            <ul className="space-y-[10px] text-[17px] leading-[1.7]">
              {writeup.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{link.title || link.url} ↗</a>
                </li>
              ))}
            </ul>
          ) : <p className="text-[15px]">No resources were attached to this writeup.</p>}
        </section>

        {media.length > 0 && (
          <section className="border-t-[3px] border-ink">
            <div className="border-b-[3px] border-ink px-[26px] py-[18px]">
              <h2 className="text-[14px] font-bold uppercase">Photos</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[16px] p-[20px]">
              {media.map((item) => (
                <figure key={item.id} className="border-[3px] border-ink bg-white">
                  <img src={item.url} alt={item.altText || item.caption || writeup.title} className="h-[200px] w-full border-b-[3px] border-ink object-cover" />
                  {item.caption && <figcaption className="px-[12px] py-[10px] text-[13px] font-bold">{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="border-t-[3px] border-ink">
            <div className="border-b-[3px] border-ink px-[26px] py-[18px]">
              <h2 className="text-[14px] font-bold uppercase">More from this track</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px] p-[20px]">
              {related.map((item) => (
                <article key={item.id} className="border-[3px] border-ink bg-white p-[22px]">
                  <Tag label={trackLabel(item.trackId)} color={trackTagColor(item.trackId)} />
                  <h3 className="mt-[14px] text-[20px] font-bold leading-[1.25]">{item.title}</h3>
                  <p className="mt-[8px] text-[14px] leading-[1.5] text-[#333]">{item.summary}</p>
                  <a href={`/writeup?id=${item.id}`} className="mt-[14px] inline-block text-[12px] font-bold uppercase underline underline-offset-4">Read ↗</a>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>;
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getWriteupById, getUserById, getWriteups, getMediaByWriteup, getEventById, type WriteupWithId, type AppUserWithId, type MediaWithId, type EventWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";

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
        <header className="border-b-[3px] border-ink px-[26px] py-[36px]">
          <Tag label={writeup.trackId === "women-in-tech" ? "Women in Tech" : writeup.trackId} color={trackTagColor(writeup.trackId)} />
          {writeup.aiDrafted && <p className="mt-[16px] text-[11px] font-bold uppercase">Drafted with AI, reviewed by {author?.name || "the lead"}</p>}
          <h1 className="mt-[18px] max-w-[1000px] font-display text-[clamp(48px,8vw,104px)] uppercase leading-[.94]">{writeup.title}</h1>
          <p className="mt-[18px] text-[13px] font-bold uppercase">
            By {author ? <a href={`/lead?id=${author.id}`} className="underline">{author.name}</a> : "GDG TUM lead"} · {date}
            {event ? <> · <a href={`/event?id=${event.id}`} className="underline">{event.title}</a></> : null}
          </p>
        </header>
        <section className="border-b-[3px] border-ink bg-yellow px-[26px] py-[24px]">
          <p className="max-w-[860px] text-[17px] leading-[1.55]">{writeup.summary}</p>
        </section>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] font-bold">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0 border-b-[3px] border-ink px-[26px] py-[30px] lg:border-b-0 lg:border-r-[3px]">
            <h2 className="mb-[18px] font-display text-[38px] uppercase">What we covered</h2>
            <div className="space-y-[16px] text-[15px] leading-[1.75] [&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:font-display [&_h1]:text-4xl [&_h1]:uppercase [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:uppercase [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-bold [&_li]:ml-6 [&_li]:list-disc [&_ol_li]:list-decimal [&_a]:underline [&_blockquote]:border-l-[3px] [&_blockquote]:border-ink [&_blockquote]:pl-4 [&_pre]:overflow-x-auto [&_pre]:border-[3px] [&_pre]:border-ink [&_pre]:bg-[#f5f5f5] [&_pre]:p-4 [&_code]:font-mono [&_hr]:my-6 [&_hr]:border-ink">
              <ReactMarkdown>{writeup.body}</ReactMarkdown>
            </div>
            {writeup.tags?.topics?.length ? (
              <section className="mt-[34px] border-t-[3px] border-ink pt-[20px]">
                <h2 className="text-[12px] font-bold uppercase">Topics covered</h2>
                <div className="mt-[12px] flex flex-wrap gap-[8px]">
                  {writeup.tags.topics.map((topic) => <span key={topic} className="border-[2px] border-ink px-[10px] py-[6px] text-[11px] font-bold uppercase">{topic}</span>)}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="px-[26px] py-[30px]">
            <h2 className="font-display text-[30px] uppercase">Resources</h2>
            {writeup.links?.length ? (
              <ul className="mt-[12px]">
                {writeup.links.map((link) => (
                  <li key={link.url} className="border-b-[2px] border-ink py-[12px]">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold underline underline-offset-4">{link.title || link.url} ↗</a>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-[12px] text-[13px]">No resources were attached to this writeup.</p>}
          </aside>
        </div>

        {media.length > 0 && (
          <section className="border-t-[3px] border-ink">
            <div className="px-[26px] py-[20px]"><h2 className="font-display text-[42px] uppercase">Photos</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item) => (
                <figure key={item.id} className="border-t-[3px] border-r-[3px] border-ink">
                  <img src={item.url} alt={item.altText || item.caption || writeup.title} className="aspect-[4/3] w-full object-cover" />
                  {item.caption && <figcaption className="border-t-[3px] border-ink px-[14px] py-[12px] text-[13px] font-bold">{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="border-t-[3px] border-ink">
            <div className="px-[26px] py-[20px]"><h2 className="font-display text-[42px] uppercase">More from this track</h2></div>
            <div className="grid grid-cols-1 border-t-[3px] border-ink sm:grid-cols-3">
              {related.map((item, index) => (
                <article key={item.id} className={`border-b-[3px] border-r-[3px] border-ink p-[20px] ${index === 1 ? "bg-yellow" : "bg-white"}`}>
                  <Tag label={item.trackId} color={trackTagColor(item.trackId)} />
                  <h3 className="mt-[14px] text-[18px] font-bold">{item.title}</h3>
                  <p className="mt-[8px] text-[13px] leading-[1.5]">{item.summary}</p>
                  <a href={`/writeup?id=${item.id}`} className="mt-[16px] inline-block text-[12px] font-bold uppercase underline">Read ↗</a>
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

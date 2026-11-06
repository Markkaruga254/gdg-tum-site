"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getEventById, getTicker, getWriteupById, getMediaByWriteup, type EventWithId, type TickerWithId, type WriteupWithId, type MediaWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";

function trackName(track: string) {
  return track === "women-in-tech" ? "Women in Tech" : track[0].toUpperCase() + track.slice(1);
}

function EventDetail() {
  const params = useSearchParams();
  const id = params.get("id");
  const [event, setEvent] = useState<EventWithId | null>(null);
  const [ticker, setTicker] = useState<TickerWithId | null>(null);
  const [writeup, setWriteup] = useState<WriteupWithId | null>(null);
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
        const current = await getEventById(id);
        if (!active) return;
        setEvent(current);
        if (current) {
          const [tickerItems, relatedWriteup] = await Promise.all([
            getTicker(),
            current.writeupId ? getWriteupById(current.writeupId) : Promise.resolve(null),
          ]);
          if (!active) return;
          setTicker(tickerItems.find((item) => item.eventId === current.id && item.status === "active") || null);
          setWriteup(relatedWriteup);
          if (relatedWriteup) {
            try {
              const photos = await getMediaByWriteup(relatedWriteup.id);
              if (active) setMedia(photos);
            } catch {
              if (active) setMedia([]);
            }
          }
        }
      } catch {
        if (active) setError("Event details could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading event…</main><Footer /></>;
  if (!event) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[56px] uppercase">Event not found</h1><a href="/events" className="mt-4 inline-block underline">Back to events</a></main><Footer /></>;

  const date = event.date.toDate();
  const stateLabel = event.status === "live" ? "Live now" : event.status === "past" ? "Past event" : event.status === "cancelled" ? "Cancelled" : "Upcoming";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
            <Tag label={trackName(event.trackId)} color={trackTagColor(event.trackId)} />
            <p className="mt-[18px] text-[12px] font-bold uppercase">{stateLabel}</p>
            <h1 className="mt-[12px] font-display text-[clamp(48px,8vw,104px)] uppercase leading-[.92]">{event.title}</h1>
        </header>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] font-bold">{error}</p>}

        {event.status === "upcoming" && (
          <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-2">
            <div className="border-b-[3px] border-ink px-[26px] py-[26px] md:border-b-0 md:border-r-[3px]">
              <h2 className="text-[12px] font-bold uppercase">Details</h2>
              <p className="mt-[12px] text-[16px] leading-[1.65]">
                {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}<br />
                {event.venue}<br />
                Track: {trackName(event.trackId)}
              </p>
              <button type="button" disabled className="mt-[20px] cursor-not-allowed border-[3px] border-ink bg-blue px-[18px] py-[12px] text-[12px] font-bold uppercase text-white opacity-60">RSVP (coming soon)</button>
            </div>
            <div className="bg-yellow px-[26px] py-[26px]">
              <h2 className="text-[12px] font-bold uppercase">About this event</h2>
              <p className="mt-[12px] text-[16px] leading-[1.6]">
                {(event as EventWithId & { description?: string }).description || "The event description has not been added yet."}
              </p>
            </div>
          </section>
        )}

        {event.status === "live" && (
          <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="border-b-[3px] border-ink px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]"><h2 className="text-[13px] font-bold uppercase">Live now</h2></div>
            <div className="bg-green px-[26px] py-[24px]"><p className="font-display text-[clamp(28px,4vw,48px)] uppercase leading-[1.05]">{ticker?.message || "This event is live. Updates will appear here."}</p></div>
          </section>
        )}

        {event.status === "past" && (
          <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="border-b-[3px] border-ink px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]"><h2 className="text-[13px] font-bold uppercase">Past event</h2></div>
            <div className="px-[26px] py-[24px]">
              <p className="font-display text-[clamp(52px,7vw,76px)] uppercase leading-none">{(event.attendance ?? 0).toLocaleString()}</p>
              <p className="mt-[8px] text-[12px] font-bold uppercase">Attended</p>
              {writeup && <a href={`/writeup?id=${writeup.id}`} className="mt-[20px] inline-block border-[3px] border-ink px-[16px] py-[12px] text-[12px] font-bold uppercase underline">Read the writeup ↗</a>}
            </div>
          </section>
        )}

        {event.status === "cancelled" && (
          <p className="border-b-[3px] border-ink bg-red px-[26px] py-[22px] text-[13px] font-bold uppercase">This event has been cancelled.</p>
        )}

        {event.status === "past" && media.length > 0 && (
          <section>
            <div className="border-b-[3px] border-ink px-[26px] py-[22px]"><h2 className="font-display text-[42px] uppercase">Photos</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item) => (
                <figure key={item.id} className="border-b-[3px] border-r-[3px] border-ink">
                  <img src={item.url} alt={item.altText || item.caption || event.title} className="aspect-[4/3] w-full object-cover" />
                  {item.caption && <figcaption className="border-t-[3px] border-ink px-[14px] py-[12px] text-[13px] font-bold">{item.caption}</figcaption>}
                </figure>
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
  return <Suspense fallback={<p>Loading…</p>}><EventDetail /></Suspense>;
}

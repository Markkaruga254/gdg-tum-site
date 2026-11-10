"use client";

import { Suspense, useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getEventById, getWriteupById, getWriteups, getMediaByWriteup, type EventWithId, type TickerWithId, type WriteupWithId, type MediaWithId } from "@/lib/data";
import { trackName, trackTagColor } from "@/lib/tracks";

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
    let unsubscribeTicker: (() => void) | undefined;
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
          let linkedWriteup: WriteupWithId | null = null;
          if (current.writeupId) {
            try {
              linkedWriteup = await getWriteupById(current.writeupId);
            } catch {
              // A stale link to a draft must not prevent the public event page loading.
            }
          }
          const relatedWriteup = linkedWriteup?.status === "published"
            ? linkedWriteup
            : (await getWriteups({ status: "published", eventId: current.id }))
                .sort((a, b) => (b.publishedAt?.toMillis() ?? 0) - (a.publishedAt?.toMillis() ?? 0))[0] ?? null;
          if (!active) return;
          setWriteup(relatedWriteup);
          if (current.status === "live") {
            const activeTickerQuery = query(collection(db, "ticker"), where("status", "==", "active"));
            unsubscribeTicker = onSnapshot(activeTickerQuery, (snapshot) => {
              if (!active) return;
              const latest = snapshot.docs
                .map((item) => ({ id: item.id, ...item.data() }) as TickerWithId)
                .filter((item) => item.eventId === current.id)
                .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0))[0] ?? null;
              setTicker(latest);
            }, () => {
              if (active) setError("Live event updates could not be loaded.");
            });
          }
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
    return () => { active = false; unsubscribeTicker?.(); };
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
          <div className="flex flex-wrap items-center gap-[10px]">
            <Tag label={trackName(event.trackId)} color={trackTagColor(event.trackId)} />
            <Tag label={stateLabel} color={event.status === "live" ? "green" : event.status === "cancelled" ? "red" : "ink"} />
          </div>
          <h1 className="mt-[16px] font-display text-[clamp(56px,8vw,104px)] uppercase leading-[.92]">{event.title}</h1>
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
                {event.description || "The event description has not been added yet."}
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
            </div>
          </section>
        )}

        {writeup && (
          <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="border-b-[3px] border-ink bg-yellow px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]">
              <h2 className="text-[13px] font-bold uppercase">Event writeup</h2>
            </div>
            <div className="px-[26px] py-[24px]">
              <h3 className="font-display text-[clamp(32px,5vw,56px)] uppercase leading-[1.02]">{writeup.title}</h3>
              {writeup.summary && <p className="mt-[12px] max-w-[760px] text-[16px] leading-[1.6]">{writeup.summary}</p>}
              <a href={`/writeup?id=${writeup.id}`} className="mt-[18px] inline-block text-[12px] font-bold uppercase underline underline-offset-4">Read full writeup ↗</a>
            </div>
          </section>
        )}

        {event.status === "cancelled" && (
          <p className="border-b-[3px] border-ink bg-red px-[26px] py-[22px] text-[13px] font-bold uppercase">This event has been cancelled.</p>
        )}

        {event.status === "past" && media.length > 0 && (
          <section>
            <div className="border-y-[3px] border-ink px-[26px] py-[18px]"><h2 className="text-[14px] font-bold uppercase">Photos</h2></div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[16px] p-[20px]">
              {media.map((item) => (
                <figure key={item.id} className="border-[3px] border-ink bg-white">
                  <img src={item.url} alt={item.altText || item.caption || event.title} className="h-[200px] w-full border-b-[3px] border-ink object-cover" />
                  {item.caption && <figcaption className="px-[12px] py-[10px] text-[13px] font-bold">{item.caption}</figcaption>}
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

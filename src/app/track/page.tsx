"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getTrackBySlug, getUserById, getEvents, getWriteups, type TrackWithId, type EventWithId, type WriteupWithId, type AppUserWithId } from "@/lib/data";
import { TRACK_BG_COLORS, trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

function dateLabel(value: EventWithId["date"]) {
  const date = value.toDate();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function View() {
  const params = useSearchParams();
  const slug = params.get("slug");
  const [track, setTrack] = useState<TrackWithId | null>(null);
  const [leads, setLeads] = useState<AppUserWithId[]>([]);
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [writeups, setWriteups] = useState<WriteupWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const current = await getTrackBySlug(slug as TrackSlug);
        if (!active) return;
        if (!current) {
          setTrack(null);
          setLoading(false);
          return;
        }
        setTrack(current);
        const [leadResults, eventResults, writeupResults] = await Promise.all([
          Promise.all(current.leadIds.map((id) => getUserById(id))),
          getEvents({ trackId: current.slug }),
          getWriteups({ status: "published", trackId: current.slug }),
        ]);
        if (!active) return;
        setLeads(leadResults.filter((lead): lead is AppUserWithId => lead !== null));
        setEvents(eventResults.filter((event) => event.status !== "cancelled"));
        setWriteups(writeupResults);
      } catch {
        if (active) setError("Some track information could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  if (loading) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading track…</main><Footer /></>;
  if (!track) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[56px] uppercase">Track not found</h1><a className="mt-4 inline-block underline" href="/tracks">Back to tracks</a></main><Footer /></>;

  const upcoming = events.filter((event) => event.status === "upcoming" || event.status === "live")
    .sort((a, b) => a.date.toMillis() - b.date.toMillis());
  const past = events.filter((event) => event.status === "past")
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  const darkText = track.color === "green" || track.color === "yellow";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]" style={{ backgroundColor: TRACK_BG_COLORS[track.slug], color: darkText ? "#111" : "#fff" }}>
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-none">{track.name}</h1>
          <p className="mt-[14px] max-w-[600px] text-[17px] leading-[1.5]">{track.description}</p>
          {leads.length > 0 && (
            <div className="mt-[18px] flex flex-wrap gap-[10px]">
              {leads.map((lead) => (
                <a key={lead.id} href={`/lead?id=${lead.id}`} className="border-[3px] border-ink bg-white px-[20px] py-[12px] text-[12px] font-bold uppercase text-ink">{lead.name} ↗</a>
              ))}
            </div>
          )}
        </header>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] font-bold">{error}</p>}

        <section>
          <div className="flex flex-wrap items-center justify-between gap-[10px] border-y-[3px] border-ink px-[26px] py-[18px]">
            <h2 className="text-[14px] font-bold uppercase">Upcoming events</h2>
          </div>
          {upcoming.length ? upcoming.map((event, index) => (
            <article key={event.id} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-[14px] border-b-[3px] border-ink bg-white px-[20px] py-[16px] sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:gap-[18px] sm:px-[26px]">
              <span className="font-display text-[48px] leading-none sm:text-[56px]">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <a href={`/event?id=${event.id}`} className="text-[18px] font-bold underline-offset-4 hover:underline sm:text-[20px]">{event.title}</a>
                <p className="mt-[4px] text-[13px]">{dateLabel(event.date)} · {event.venue}</p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-[12px] sm:col-start-auto">
                <Tag label={track.name} color={trackTagColor(track.slug)} />
                <a href={`/event?id=${event.id}`} className="text-[12px] font-bold uppercase underline underline-offset-4">RSVP ↗</a>
              </div>
            </article>
          )) : <p className="px-[26px] py-[20px] text-[13px] font-bold uppercase">No upcoming events.</p>}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-[10px] border-y-[3px] border-ink px-[26px] py-[18px]">
            <h2 className="text-[14px] font-bold uppercase">Past events</h2>
          </div>
          {past.length ? past.map((event, index) => (
            <article key={event.id} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-[14px] border-b-[3px] border-ink bg-white px-[20px] py-[16px] sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:gap-[18px] sm:px-[26px]">
              <span className="font-display text-[48px] leading-none sm:text-[56px]">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <a href={`/event?id=${event.id}`} className="text-[18px] font-bold underline-offset-4 hover:underline sm:text-[20px]">{event.title}</a>
                <p className="mt-[4px] text-[13px]">{dateLabel(event.date)} · {event.attendance ?? 0} attended</p>
              </div>
              <div className="col-start-2 flex flex-wrap items-center gap-[12px] sm:col-start-auto">
                <Tag label={track.name} color={trackTagColor(track.slug)} />
                <a href={event.writeupId ? `/writeup?id=${event.writeupId}` : `/event?id=${event.id}`} className="text-[12px] font-bold uppercase underline underline-offset-4">{event.writeupId ? "Writeup ↗" : "Event details ↗"}</a>
              </div>
            </article>
          )) : <p className="px-[26px] py-[20px] text-[13px] font-bold uppercase">No past events yet.</p>}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-[10px] border-y-[3px] border-ink px-[26px] py-[18px]">
            <h2 className="text-[14px] font-bold uppercase">Writeups</h2>
          </div>
          {writeups.length ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px] p-[20px]">
              {writeups.map((writeup) => (
                <article key={writeup.id} className="border-[3px] border-ink bg-white p-[22px]">
                  <Tag label={track.name} color={trackTagColor(track.slug)} />
                  <h3 className="mt-[14px] text-[20px] font-bold leading-[1.25]">{writeup.title}</h3>
                  <p className="mt-[8px] text-[14px] leading-[1.5] text-[#333]">{writeup.summary}</p>
                  <a href={`/writeup?id=${writeup.id}`} className="mt-[14px] inline-block text-[12px] font-bold uppercase underline underline-offset-4">Read ↗</a>
                </article>
              ))}
            </div>
          ) : <p className="px-[26px] py-[22px] text-[13px] font-bold uppercase">No published writeups yet.</p>}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>;
}

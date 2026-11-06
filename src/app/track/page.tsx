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
        <header className="border-b-[3px] border-ink px-[26px] py-[44px]" style={{ backgroundColor: TRACK_BG_COLORS[track.slug], color: darkText ? "#111" : "#fff" }}>
          <Tag label={track.name} color={trackTagColor(track.slug)} />
          <h1 className="mt-[20px] font-display text-[clamp(64px,10vw,132px)] uppercase leading-[.9]">{track.name}</h1>
          <p className="mt-[18px] max-w-[700px] text-[17px] leading-[1.5]">{track.description}</p>
          <p className="mt-[22px] text-[12px] font-bold uppercase">
            {leads.length ? <>Led by {leads.map((lead) => lead.name).join(", ")}</> : "Track leads to be announced"}
          </p>
        </header>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] font-bold">{error}</p>}

        <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="border-b-[3px] border-ink px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]">
            <h2 className="text-[13px] font-bold uppercase">Track leads</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {leads.length ? leads.map((lead) => (
              <a key={lead.id} href={`/lead?id=${lead.id}`} className="border-b-[3px] border-ink px-[22px] py-[20px] font-bold uppercase underline underline-offset-4 sm:border-r-[3px]">
                {lead.name} ↗
              </a>
            )) : <p className="px-[22px] py-[20px] text-[13px] uppercase">Lead information coming soon.</p>}
          </div>
        </section>

        <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="border-b-[3px] border-ink px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]">
            <h2 className="text-[13px] font-bold uppercase">Upcoming events</h2>
          </div>
          <div>
            {upcoming.length ? upcoming.map((event, index) => (
              <a key={event.id} href={`/event?id=${event.id}`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-[14px] border-b-[3px] border-ink px-[18px] py-[16px] last:border-b-0">
                <span className="font-display text-[38px] leading-none">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0"><strong className="block text-[16px]">{event.title}</strong><span className="text-[12px]">{dateLabel(event.date)} · {event.venue}</span></span>
                <span className="text-[11px] font-bold uppercase underline">RSVP ↗</span>
              </a>
            )) : <p className="px-[22px] py-[20px] text-[13px] uppercase">No upcoming events.</p>}
          </div>
        </section>

        <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="border-b-[3px] border-ink px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]">
            <h2 className="text-[13px] font-bold uppercase">Past events</h2>
          </div>
          <div>
            {past.length ? past.map((event, index) => (
              <a key={event.id} href={`/event?id=${event.id}`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-[14px] border-b-[3px] border-ink px-[18px] py-[16px] last:border-b-0">
                <span className="font-display text-[38px] leading-none">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0"><strong className="block text-[16px]">{event.title}</strong><span className="text-[12px]">{dateLabel(event.date)} · {event.attendance ?? 0} attended</span></span>
                <span className="text-[11px] font-bold uppercase underline">{event.writeupId ? "Writeup ↗" : "Details ↗"}</span>
              </a>
            )) : <p className="px-[22px] py-[20px] text-[13px] uppercase">No past events yet.</p>}
          </div>
        </section>

        <section>
          <div className="border-b-[3px] border-ink px-[26px] py-[22px]">
            <h2 className="font-display text-[42px] uppercase leading-none">Writeups</h2>
          </div>
          {writeups.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {writeups.map((writeup, index) => (
                <article key={writeup.id} className={`border-b-[3px] border-r-[3px] border-ink p-[22px] ${index % 3 === 1 ? "bg-yellow" : "bg-white"}`}>
                  <Tag label={track.name} color={trackTagColor(track.slug)} />
                  <h3 className="mt-[16px] text-[20px] font-bold leading-[1.2]">{writeup.title}</h3>
                  <p className="mt-[10px] text-[13px] leading-[1.5]">{writeup.summary}</p>
                  <a href={`/writeup?id=${writeup.id}`} className="mt-[18px] inline-block text-[12px] font-bold uppercase underline underline-offset-4">Read ↗</a>
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

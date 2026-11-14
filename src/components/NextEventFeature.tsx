"use client";

import { useState } from "react";
import type { EventWithId } from "@/lib/data";

function trackLabel(trackId: string) {
  if (trackId === "chapter") return "Chapter event";
  if (trackId === "ai-ml") return "AI / ML";
  if (trackId === "women-in-tech") return "Women in Tech";
  if (trackId === "hackathons-solutions") return "Hackathons & Solutions";
  return trackId.replaceAll("-", " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase());
}

export default function NextEventFeature({
  event,
  imageUrl,
  loading,
}: {
  event: EventWithId | undefined;
  imageUrl?: string;
  loading: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      aria-labelledby="homepage-next-event-heading"
      className="relative flex-1 overflow-hidden border-b-[3px] border-ink bg-blue px-[16px] py-[18px] text-white sm:px-[20px] sm:py-[22px] xl:px-[26px] xl:py-[24px]"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="homepage-next-event-heading" className="text-[11px] font-bold uppercase tracking-[.16em] text-white/80">Next event</h2>
        <a href="/events" className="shrink-0 text-[10px] font-bold uppercase tracking-wide underline underline-offset-4 hover:text-white/75">
          All events ↗
        </a>
      </div>

      {loading ? (
        <div className="grid min-h-[220px] animate-pulse grid-cols-2 overflow-hidden border-[2px] border-ink/30 bg-white/10 xl:min-h-[240px]">
          <div className="bg-white/10" />
          <div className="p-4">
            <div className="h-3 w-2/3 bg-white/20" />
            <div className="mt-4 h-8 w-full bg-white/20" />
            <div className="mt-3 h-3 w-4/5 bg-white/20" />
          </div>
        </div>
      ) : !event ? (
        <div className="flex min-h-[220px] flex-col justify-center border-[2px] border-ink/30 bg-blue-700/25 px-5 py-6 sm:min-h-[240px]">
          <h2 className="font-display text-[30px] uppercase leading-none sm:text-[36px]">Nothing scheduled yet.</h2>
          <p className="mt-3 max-w-sm text-[13px] leading-5 text-white/80">We’re planning the next community session. Check the events calendar for updates.</p>
          <a href="/events" className="mt-5 w-fit border-[2px] border-ink bg-white px-4 py-2 text-[10px] font-bold uppercase text-ink hover:bg-yellow">Explore events ↗</a>
        </div>
      ) : (
        <article className="grid min-h-[250px] grid-cols-1 overflow-visible border-[2px] border-ink/35 bg-[#101827]/95 xl:min-h-[260px] xl:grid-cols-2">
          <div className="relative min-h-[190px] overflow-visible xl:min-h-[260px]">
            <div className="absolute inset-0 overflow-hidden">
              {imageUrl && !imageFailed ? (
                <img
                  src={imageUrl}
                  alt={`Community photo from a ${trackLabel(event.trackId)} event`}
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full min-h-[190px] items-center justify-center bg-[radial-gradient(ellipse_at_70%_30%,rgba(66,133,244,.4),transparent_50%),linear-gradient(135deg,#172033,#0d111b)]">
                  <div className="px-5 text-center">
                    <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-2xl text-blue-200">✦</span>
                    <p className="mt-3 text-[9px] font-bold uppercase tracking-[.16em] text-white/60">GDG on Campus · TUM</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
            </div>
            <div className="absolute -bottom-3 right-3 z-10 rounded-lg bg-[linear-gradient(145deg,#4285f4_0%,#4285f4_28%,#ea4335_28%,#ea4335_52%,#fbbc04_52%,#fbbc04_76%,#34a853_76%)] p-[2px] shadow-lg xl:-right-3 xl:bottom-5">
              <div className="flex h-[76px] w-[72px] flex-col items-center justify-center rounded-[6px] bg-[#10141d]">
                <span className="text-[8px] font-bold tracking-[.12em] text-white/65">{event.date.toDate().toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</span>
                <span className="font-display text-[34px] leading-none">{event.date.toDate().toLocaleDateString(undefined, { day: "2-digit" })}</span>
                <span className="mt-0.5 text-[10px] font-bold tracking-[.1em] text-blue-300">{event.date.toDate().toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center px-5 pb-5 pt-8 xl:px-5 xl:py-5 xl:pl-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-blue-100">Featured</span>
              <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-white/55">{trackLabel(event.trackId)}</span>
            </div>
            <h2 className="mt-3 break-words font-display text-[clamp(1.55rem,3vw,2.35rem)] uppercase leading-[.98] tracking-[-.02em]">{event.title}</h2>
            <p className="mt-2 line-clamp-2 text-[11px] leading-[1.5] text-white/65">{event.description || "Join fellow students and developers for a practical community session."}</p>
            <div className="mt-3 space-y-1 text-[10px] text-white/80">
              <p>{event.date.toDate().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {event.date.toDate().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
              <p className="truncate">{event.venue}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled aria-describedby="homepage-rsvp-status" className="inline-flex min-h-9 cursor-not-allowed items-center justify-center border-[2px] border-ink bg-white px-3 py-2 text-[9px] font-bold uppercase text-ink opacity-65">
                RSVP opening soon
              </button>
              <a href={`/event?id=${encodeURIComponent(event.id)}`} className="inline-flex min-h-9 items-center justify-center border-[2px] border-white/50 px-3 py-2 text-[9px] font-bold uppercase text-white hover:bg-white/10">
                Details ↗
              </a>
            </div>
            <p id="homepage-rsvp-status" className="sr-only">Registration will be available when RSVP opens.</p>
          </div>
        </article>
      )}
    </section>
  );
}

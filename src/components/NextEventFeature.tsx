"use client";

import { useState } from "react";
import type { EventWithId } from "@/lib/data";

function trackLabel(trackId: string) {
  if (trackId === "chapter") return "Chapter event";
  if (trackId === "ai-ml") return "AI / ML";
  if (trackId === "women-in-tech") return "Women in Tech";
  if (trackId === "hackathons-solutions") return "Hackathons & Solutions";
  return trackId.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  if (loading) {
    return (
      <section aria-labelledby="next-event-heading" className="border-b border-white/10 bg-[#0b0d12] px-5 py-12 text-white sm:px-8 xl:px-12 xl:py-16">
        <div className="mx-auto max-w-[1184px]">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-300">What’s next</p>
          <h2 id="next-event-heading" className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">Next event</h2>
          <div className="mt-8 h-[320px] animate-pulse rounded-2xl border border-white/10 bg-white/[.04] sm:h-[390px]" />
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section aria-labelledby="next-event-heading" className="border-b border-white/10 bg-[#0b0d12] px-5 py-12 text-white sm:px-8 xl:px-12 xl:py-16">
        <div className="mx-auto max-w-[1184px]">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-300">What’s next</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="next-event-heading" className="font-display text-4xl uppercase leading-none sm:text-5xl">Next event</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">We’re planning the next community session. Check the events calendar for updates.</p>
            </div>
            <a href="/events" className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-white">View all events <span aria-hidden="true" className="ml-2">↗</span></a>
          </div>
        </div>
      </section>
    );
  }

  const date = event.date.toDate();
  const day = date.toLocaleDateString(undefined, { day: "2-digit" });
  const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
  const dateLabel = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const hasImage = Boolean(imageUrl) && !imageFailed;
  const eventHref = `/event?id=${encodeURIComponent(event.id)}`;

  return (
    <section aria-labelledby="next-event-heading" className="relative overflow-hidden border-b border-white/10 bg-[#0b0d12] px-5 py-12 text-white sm:px-8 xl:px-12 xl:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-8 h-72 w-72 rounded-full border border-blue-400/10" />
      <div className="relative mx-auto max-w-[1184px]">
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-300"><span aria-hidden="true" className="inline-block h-1 w-6 rounded-full bg-blue-400" /> Next event</p>
            <h2 id="next-event-heading" className="mt-3 font-display text-4xl uppercase leading-[.96] sm:text-5xl">What’s happening <span className="text-blue-400">next?</span></h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/65 sm:text-right">Join our next community session, build new skills, and connect with fellow developers at TUM.</p>
        </div>

        <article className="grid overflow-visible rounded-2xl border border-white/15 bg-white/[.025] shadow-[0_24px_80px_rgba(0,0,0,.22)] md:grid-cols-2">
          <div className="relative min-h-[260px] overflow-visible rounded-t-2xl md:min-h-[420px] md:rounded-l-2xl md:rounded-tr-none">
            <div className="absolute inset-0 overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
              {hasImage ? (
                <img src={imageUrl} alt={`Community photo from a ${trackLabel(event.trackId)} event`} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
              ) : (
                <div className="flex h-full min-h-[260px] items-center justify-center bg-[radial-gradient(ellipse_at_70%_30%,rgba(25,103,210,.32),transparent_48%),linear-gradient(135deg,#172033,#0d111b_65%,#171b25)]">
                  <div className="px-8 text-center">
                    <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-3xl text-blue-300">✦</span>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[.2em] text-white/55">GDG on Campus · TUM</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
            </div>
            <div className="absolute -bottom-7 right-5 z-10 rounded-2xl bg-[linear-gradient(145deg,#4285f4_0%,#4285f4_28%,#ea4335_28%,#ea4335_52%,#fbbc04_52%,#fbbc04_76%,#34a853_76%)] p-[2px] shadow-[0_12px_36px_rgba(0,0,0,.45)] md:-right-7 md:bottom-8">
              <div className="flex h-[108px] w-[100px] flex-col items-center justify-center rounded-[14px] bg-[#10141d] md:h-[122px] md:w-[108px]">
                <span className="text-[10px] font-bold tracking-[.14em] text-white/65">{weekday}</span>
                <span className="font-display text-5xl leading-none">{day}</span>
                <span className="mt-1 text-sm font-bold tracking-[.12em] text-blue-300">{month}</span>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col px-6 pb-6 pt-12 sm:px-8 sm:pb-8 md:py-9 md:pl-12 md:pr-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-blue-200"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Featured event</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.08em] text-white/65">{trackLabel(event.trackId)}</span>
            </div>
            <h3 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] uppercase leading-[.98] tracking-[-.02em]">{event.title}</h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">{event.description || "Join fellow students and developers for a practical community session."}</p>

            <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 text-lg text-blue-300">▦</span>
                <div><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Date</dt><dd className="mt-1 text-white/90">{dateLabel}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 text-lg text-blue-300">◷</span>
                <div><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Time</dt><dd className="mt-1 text-white/90">{timeLabel}</dd></div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <span aria-hidden="true" className="mt-0.5 text-lg text-blue-300">⌖</span>
                <div><dt className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Location</dt><dd className="mt-1 text-white/90">{event.venue}</dd></div>
              </div>
            </dl>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button type="button" disabled aria-describedby="rsvp-status" className="inline-flex min-h-12 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white opacity-75">
                RSVP (coming soon) <span aria-hidden="true">→</span>
              </button>
              <a href={eventHref} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10">View event details <span aria-hidden="true" className="ml-2">↗</span></a>
            </div>
            <p id="rsvp-status" className="mt-2 text-center text-[11px] text-white/40 sm:text-left">Registration will be available when RSVP opens.</p>
          </div>
        </article>
        <div className="mt-5 flex justify-end">
          <a href="/events" className="text-xs font-semibold text-white/55 transition-colors hover:text-white">View all events <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}

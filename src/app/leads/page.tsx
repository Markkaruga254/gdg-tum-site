"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getEvents, getUsers, getWriteups, type AppUserWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

const filters: { id: TrackSlug | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cloud", label: "Cloud" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "web", label: "Web" },
  { id: "women-in-tech", label: "Women in Tech" },
];

function trackName(track: TrackSlug) {
  return track === "women-in-tech" ? "Women in Tech" : track[0].toUpperCase() + track.slice(1);
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<AppUserWithId[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [writeupCounts, setWriteupCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<TrackSlug | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [users, events, writeups] = await Promise.all([
          getUsers("lead"),
          getEvents(),
          getWriteups({ status: "published" }),
        ]);
        setLeads(users);
        setEventCounts(events.reduce<Record<string, number>>((counts, event) => {
          counts[event.trackId] = (counts[event.trackId] || 0) + 1;
          return counts;
        }, {}));
        setWriteupCounts(writeups.reduce<Record<string, number>>((counts, writeup) => {
          counts[writeup.authorId] = (counts[writeup.authorId] || 0) + 1;
          return counts;
        }, {}));
      } catch {
        setError("We could not load the track leads. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleLeads = leads.filter((lead) => filter === "all" || lead.track === filter);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Leads</h1>
          <p className="mt-[14px] max-w-[600px] text-[17px] leading-[1.5]">
            The students who run our tracks, teach sessions and publish writeups.
          </p>
        </header>

        <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Filter leads by track">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              aria-pressed={filter === item.id}
              className={`border-r-[3px] border-ink px-[22px] py-[16px] text-[12px] font-bold uppercase ${filter === item.id ? "bg-yellow" : "bg-white"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[18px] font-bold">{error}</p>}
        {loading ? (
          <p className="px-[26px] py-[24px] text-[13px] font-bold uppercase">Loading leads…</p>
        ) : visibleLeads.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[24px] text-[13px] font-bold uppercase">
            {leads.length === 0 ? "No track leads have been added yet." : "No leads in this track yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {visibleLeads.map((lead, index) => (
              <article key={lead.id} className={`grid grid-cols-[112px_minmax(0,1fr)] border-b-[3px] border-r-[3px] border-ink ${index % 4 === 1 ? "bg-yellow" : "bg-white"}`}>
                <div className="flex min-h-[190px] items-center justify-center border-r-[3px] border-ink bg-blue">
                  {lead.photoUrl ? (
                    <img src={lead.photoUrl} alt={lead.name} className="h-full min-h-[190px] w-full object-cover" />
                  ) : (
                    <span className="font-bold text-[11px] uppercase text-white">Photo</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col p-[18px]">
                  <Tag label={`${trackName(lead.track)} Track Lead`} color={trackTagColor(lead.track)} />
                  <h2 className="mt-[12px] font-display text-[clamp(25px,3vw,38px)] uppercase leading-[1]">{lead.name}</h2>
                  <p className="mt-[10px] text-[13px] leading-[1.5]">{lead.bio || "Helping students learn, build and share what they create."}</p>
                  <p className="mt-auto pt-[16px] text-[11px] font-bold uppercase">
                    {eventCounts[lead.track] || 0} events · {writeupCounts[lead.id] || 0} writeups
                  </p>
                  <a href={`/lead?id=${lead.id}`} className="mt-[12px] w-fit border-[3px] border-ink px-[12px] py-[8px] text-[11px] font-bold uppercase underline underline-offset-4">
                    View profile ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="grid grid-cols-1 border-t-[3px] border-ink bg-yellow sm:grid-cols-[1fr_auto]">
          <div className="px-[26px] py-[24px]">
            <h2 className="font-display text-[clamp(32px,5vw,54px)] uppercase leading-none">Want to lead a track?</h2>
            <p className="mt-[10px] text-[13px] leading-[1.5]">Learn with the community, run sessions and help other students build.</p>
          </div>
          <a href="/tracks" className="flex items-center border-t-[3px] border-ink px-[26px] py-[20px] text-[12px] font-bold uppercase underline underline-offset-4 sm:border-l-[3px] sm:border-t-0">Explore the tracks ↗</a>
        </section>
      </main>
      <Footer />
    </>
  );
}

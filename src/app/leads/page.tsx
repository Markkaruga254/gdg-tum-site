"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getEvents, getUsers, getWriteups, type AppUserWithId } from "@/lib/data";
import { TRACK_BG_COLORS } from "@/lib/tracks";
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
        setEventCounts(events.filter((event) => event.status === "past").reduce<Record<string, number>>((counts, event) => {
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

  const trackOrder: TrackSlug[] = ["cloud", "cybersecurity", "web", "women-in-tech"];
  const visibleLeads = leads
    .filter((lead) => filter === "all" || lead.track === filter)
    .sort((a, b) => trackOrder.indexOf(a.track) - trackOrder.indexOf(b.track));

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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px] p-[20px]">
            {visibleLeads.map((lead) => {
              const textColor = lead.track === "cloud" ? "#fff" : "#111";
              return (
                <article key={lead.id} className="border-[3px] border-ink bg-white">
                  <div className="flex min-h-[170px] items-center justify-center border-b-[3px] border-ink" style={{ backgroundColor: TRACK_BG_COLORS[lead.track], color: textColor }}>
                    {lead.photoUrl ? (
                      <img src={lead.photoUrl} alt={lead.name} className="h-[170px] w-full object-cover" />
                    ) : (
                      <span className="font-display text-[44px] uppercase">{lead.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="p-[16px]">
                    <h2 className="text-[20px] font-bold">{lead.name}</h2>
                    <p className="my-[4px] text-[12px] font-bold uppercase">{trackName(lead.track)} Track Lead</p>
                    <p className="mb-[14px] text-[14px] leading-[1.5]">{lead.bio || "Helping students learn, build and share what they create."}</p>
                    <p className="mb-[14px] text-[12px] font-bold uppercase">{eventCounts[lead.track] || 0} events · {writeupCounts[lead.id] || 0} writeups</p>
                    <a href={`/lead?id=${lead.id}`} className="inline-block border-[3px] border-ink px-[20px] py-[12px] text-[12px] font-bold uppercase">View profile ↗</a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="flex flex-wrap items-center justify-between gap-[12px] border-t-[3px] border-ink bg-yellow px-[26px] py-[22px]">
          <h2 className="font-display text-[32px] uppercase">Want to lead a track?</h2>
          <a href="/tracks" className="inline-block border-[3px] border-ink bg-white px-[20px] py-[12px] text-[12px] font-bold uppercase">Get in touch ↗</a>
        </section>
      </main>
      <Footer />
    </>
  );
}

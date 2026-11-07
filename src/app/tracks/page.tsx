"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getTracks, getUsers, type AppUserWithId, type TrackWithId } from "@/lib/data";
import { TRACK_BG_COLORS } from "@/lib/tracks";

const order = ["cloud", "cybersecurity", "web", "women-in-tech"];

export default function TracksPage() {
  const [tracks, setTracks] = useState<TrackWithId[]>([]);
  const [leads, setLeads] = useState<AppUserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [fetchedTracks, fetchedLeads] = await Promise.all([getTracks(), getUsers("lead")]);
        setTracks(fetchedTracks);
        setLeads(fetchedLeads);
      } catch {
        setError("We could not load the tracks. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sortedTracks = [...tracks].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink bg-yellow px-[26px] py-[34px] text-ink">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-none">Four tracks. One club.</h1>
          <p className="mt-[14px] max-w-[600px] text-[17px] leading-[1.5]">Pick a track, learn with others and build in public.</p>
        </header>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[18px] font-bold">{error}</p>}
        {loading ? (
          <p className="px-[26px] py-[24px] text-[13px] font-bold uppercase">Loading tracks…</p>
        ) : sortedTracks.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[24px] text-[13px] font-bold uppercase">No tracks have been added yet.</p>
        ) : (
          <div className="grid gap-[16px] p-[20px]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))" }}>
            {sortedTracks.map((track, index) => {
              const trackLeads = leads.filter((lead) => track.leadIds.includes(lead.id));
              const textColor = track.color === "blue" ? "#fff" : "#111";
              return (
                <article key={track.id} style={{ backgroundColor: TRACK_BG_COLORS[track.slug], color: textColor }} className="border-[3px] border-ink p-[26px]">
                  <p className="font-display text-[72px] leading-none">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="my-[8px] font-display text-[44px] uppercase leading-none">{track.name}</h2>
                  <p className="mb-[16px] text-[15px] leading-[1.5]">{track.description}</p>
                  <p className="mb-[16px] text-[12px] font-bold uppercase">Lead: {trackLeads.length ? trackLeads.map((lead) => lead.name).join(", ") : "To be announced"}</p>
                  <a href={`/track?slug=${track.slug}`} className="inline-block border-[3px] border-ink bg-white px-[20px] py-[12px] text-[12px] font-bold uppercase text-ink">Open track ↗</a>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

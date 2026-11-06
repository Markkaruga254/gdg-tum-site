"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getTracks, getUsers, type AppUserWithId, type TrackWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";

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
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Tracks</h1>
          <p className="mt-[14px] max-w-[620px] text-[17px] leading-[1.5]">
            Four tracks. One club. Pick a track, learn with others and build in public.
          </p>
        </header>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[18px] font-bold">{error}</p>}
        {loading ? (
          <p className="px-[26px] py-[24px] text-[13px] font-bold uppercase">Loading tracks…</p>
        ) : sortedTracks.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[24px] text-[13px] font-bold uppercase">No tracks have been added yet.</p>
        ) : (
          <div>
            {sortedTracks.map((track, index) => {
              const trackLeads = leads.filter((lead) => track.leadIds.includes(lead.id));
              return (
                <article key={track.id} className={`grid grid-cols-[76px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)_180px] border-b-[3px] border-ink ${index % 4 === 0 ? "bg-blue text-white" : index % 4 === 1 ? "bg-red" : index % 4 === 2 ? "bg-green" : "bg-yellow"}`}>
                  <div className="flex items-center justify-center border-r-[3px] border-ink px-2">
                    <span className="font-display text-[48px] leading-none sm:text-[64px]">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="min-w-0 p-[22px] sm:p-[28px]">
                    <h2 className="font-display text-[clamp(34px,5vw,64px)] uppercase leading-[.95]">{track.name}</h2>
                    <p className="mt-[12px] max-w-[620px] text-[14px] leading-[1.5]">{track.description}</p>
                    <p className="mt-[14px] text-[12px] font-bold uppercase">
                      Lead: {trackLeads.length ? trackLeads.map((lead) => lead.name).join(", ") : "To be announced"}
                    </p>
                  </div>
                  <div className="col-start-2 flex items-center px-[22px] pb-[22px] sm:col-start-auto sm:justify-center sm:border-l-[3px] sm:border-ink sm:p-[18px]">
                    <a href={`/track?slug=${track.slug}`} className="border-[3px] border-ink bg-white px-[18px] py-[12px] text-[12px] font-bold uppercase text-ink underline underline-offset-4">
                      Open track ↗
                    </a>
                  </div>
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

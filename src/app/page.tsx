"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import TickerBar from "@/components/TickerBar";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import NumberedRow from "@/components/NumberedRow";
import SectionLabel from "@/components/SectionLabel";
import { collection, query, where, orderBy, limit, getDocsFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Event, Writeup } from "@/lib/types";

const TRACKS = [
  { slug: "cloud", name: "Cloud", color: "blue" as const, lead: "[Lead name]" },
  { slug: "cybersecurity", name: "Cybersecurity", color: "red" as const, lead: "[Lead name]" },
  { slug: "web", name: "Web", color: "green" as const, lead: "[Lead name]" },
  { slug: "women-in-tech", name: "Women in Tech", color: "yellow" as const, lead: "[Lead name]" },
];

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // getDocs() resolves an empty snapshot when the backend is unreachable, so a
      // outage would render "No writeups yet." instead of an error.
      try {
        const evSnap = await getDocsFromServer(query(collection(db, "events"), orderBy("date", "asc")));
        setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Event)));
        const wSnap = await getDocsFromServer(query(collection(db, "writeups"), where("status", "==", "published"), orderBy("publishedAt", "desc"), limit(3)));
        setWriteups(wSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Writeup)));
      } catch (e) {
        console.error("Home: Firestore reads failed", e);
        const code = e instanceof Error && "code" in e ? String((e as { code: unknown }).code) : "unknown";
        setError(`read failed (${code}).`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nextEvent = events.find((e) => e.status === "upcoming") || events[0];
  const held = events.filter((e) => e.status === "past").length;

  return (
    <>
      <Nav />
      <TickerBar />
      <main className="mx-auto max-w-[1280px]">
        {error && (
          <section className="border-b-[3px] border-ink bg-red p-4 text-sm text-white">
            Events and writeups could not be loaded: {error}
          </section>
        )}
        <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-2">
          <div className="p-8">
            <h1 className="font-display text-5xl uppercase md:text-7xl">
              BUILD. LEARN. <span className="text-red">SHIP.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm">
              GDG on Campus TUM is a student developer club at the Technical University of Mombasa.
            </p>
            <a href="/tracks" className="mt-6 inline-block border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">
              Explore tracks →
            </a>
          </div>
          <div className="bg-blue p-8 text-white">
            <SectionLabel>Next event</SectionLabel>
            {loading ? (
              <p className="mt-4">Loading…</p>
            ) : error ? (
              <p className="mt-4">Event unavailable.</p>
            ) : nextEvent ? (
              <>
                <h2 className="mt-2 font-display text-2xl uppercase">{nextEvent.title}</h2>
                <p className="mt-1 text-sm">{nextEvent.venue}</p>
                <p className="mt-1 text-sm">{nextEvent.date?.toDate?.().toLocaleString?.()}</p>
                <button disabled className="mt-4 border-[3px] border-white px-4 py-2 font-bold uppercase opacity-60">
                  RSVP (soon)
                </button>
              </>
            ) : (
              <p className="mt-4">No upcoming events.</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 border-b-[3px] border-ink md:grid-cols-4">
          {[
            { label: "Events held", value: held },
            { label: "Writeups", value: writeups.length },
            { label: "Tracks", value: 4 },
            { label: "Members", value: "[N]" },
          ].map((s) => (
            <div key={s.label} className="border-r-[3px] border-ink p-6 last:border-r-0">
              <div className="font-display text-4xl">{s.value}</div>
              <div className="text-xs font-bold uppercase">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="border-b-[3px] border-ink p-6">
          <SectionLabel>Latest writeups</SectionLabel>
          {loading ? (
            <p className="mt-4">Loading…</p>
          ) : error ? (
            <p className="mt-4">Writeups unavailable.</p>
          ) : writeups.length === 0 ? (
            <p className="mt-4">No writeups yet.</p>
          ) : (
            writeups.map((w, i) => (
              <NumberedRow key={w.id} n={String(i + 1).padStart(2, "0")}>
                <div className="flex items-center gap-2">
                  <Tag label={w.trackId} color="blue" />
                  <a href={`/writeup?id=${w.id}`} className="font-bold">{w.title}</a>
                </div>
                <p className="mt-1 text-sm">{w.summary}</p>
                {w.aiDrafted && <p className="mt-1 text-xs italic">Drafted with AI, reviewed by [lead]</p>}
              </NumberedRow>
            ))
          )}
        </section>

        <section className="border-b-[3px] border-ink">
          <div className="bg-yellow p-6">
            <SectionLabel>Tracks</SectionLabel>
            <h2 className="font-display text-3xl uppercase">Four tracks, one community</h2>
          </div>
          {TRACKS.map((t, i) => (
            <details key={t.slug} className="border-t-[3px] border-ink">
              <summary className="cursor-pointer p-4 font-bold uppercase">
                {String(i + 1).padStart(2, "0")} <a href={`/track?slug=${t.slug}`} className="underline">{t.name}</a> — {t.lead}
              </summary>
              <div className="p-4 text-sm">[Track description placeholder]</div>
            </details>
          ))}
        </section>

        <section className="border-b-[3px] border-ink bg-ink p-8 text-white">
          <SectionLabel>Labs</SectionLabel>
          <h2 className="font-display text-3xl uppercase">Soon</h2>
          <p className="mt-2 text-sm">Coming soon.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

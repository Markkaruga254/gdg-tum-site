"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getPublicLeadById, getEvents, getWriteups, type AppUserWithId, type EventWithId, type WriteupWithId } from "@/lib/data";
import { TRACK_BG_COLORS, trackColor, trackName, trackTagColor } from "@/lib/tracks";

function trackLabel(track: Parameters<typeof trackName>[0]) {
  return trackName(track);
}

function dateLabel(value: EventWithId["date"]) {
  const date = value.toDate();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function View() {
  const params = useSearchParams();
  const id = params.get("id");
  const [user, setUser] = useState<AppUserWithId | null>(null);
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [writeups, setWriteups] = useState<WriteupWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getPublicLeadById(id);
        if (!active) return;
        setUser(profile);
        if (!profile) return;
        const [eventResults, writeupResults] = await Promise.all([
          profile.track ? getEvents({ trackId: profile.track }) : Promise.resolve([]),
          getWriteups({ status: "published" }).then((items) => items.filter((item) => item.authorId === id)),
        ]);
        if (!active) return;
        setEvents(eventResults);
        setWriteups(writeupResults);
      } catch {
        if (active) setError("The lead profile could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]">Loading profile…</main><Footer /></>;
  if (!user) return <><Nav /><main className="mx-auto max-w-[1280px] px-[26px] py-[32px]"><h1 className="font-display text-[56px] uppercase">Profile not found</h1><a href="/leads" className="mt-4 inline-block underline">Back to leads</a></main><Footer /></>;

  const roleTitle = user.leadershipTitle || (user.track ? `${trackLabel(user.track)} Track Lead` : "GDG TUM Lead");
  const pastEvents = events.filter((event) => event.status === "past")
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  const studentsReached = pastEvents.reduce((total, event) => total + (event.attendance || 0), 0);
  const heroColor = user.track ? TRACK_BG_COLORS[user.track] : "#FBBC04";
  const color = user.track ? trackColor(user.track) : "yellow";
  const heroTextColor = color === "blue" || color === "red" ? "#fff" : "#111";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[minmax(0,1fr)_380px]">
          <div className="px-[26px] py-[34px] md:px-[42px] md:py-[44px]">
            <Tag label={`${roleTitle} · 2026/27`} color={user.track ? trackTagColor(user.track) : "yellow"} />
            <h1 className="mt-[22px] font-display text-[clamp(60px,9vw,112px)] uppercase leading-[.9]">{user.name}</h1>
            {user.bio && <p className="mt-[20px] max-w-[620px] text-[17px] leading-[1.6]">{user.bio}</p>}
            <div className="mt-[24px] flex flex-wrap gap-[10px]">
              {user.links?.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="border-[3px] border-ink px-[16px] py-[10px] text-[12px] font-bold uppercase underline underline-offset-4">
                  {link.title || "Link"} ↗
                </a>
              ))}
            </div>
          </div>
          <div className="flex min-h-[300px] items-center justify-center border-t-[3px] border-ink md:border-l-[3px] md:border-t-0" style={{ backgroundColor: heroColor, color: heroTextColor }}>
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="h-full min-h-[320px] max-h-[460px] w-full object-cover" />
            ) : (
              <span className="font-display text-[44px] uppercase">{user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
            )}
          </div>
        </section>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] font-bold">{error}</p>}

        <section className="grid grid-cols-2 border-b-[3px] border-ink sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div className="border-b-[3px] border-r-[3px] border-ink px-[20px] py-[22px] sm:border-b-0">
            <p className="font-display text-[56px] leading-none">{pastEvents.length.toString().padStart(2, "0")}</p>
            <p className="mt-[8px] text-[11px] font-bold uppercase">Events held</p>
          </div>
          <div className="border-b-[3px] border-r-[3px] border-ink bg-yellow px-[20px] py-[22px] sm:border-b-0">
            <p className="font-display text-[56px] leading-none">{writeups.length.toString().padStart(2, "0")}</p>
            <p className="mt-[8px] text-[11px] font-bold uppercase">Writeups</p>
          </div>
          <div className="border-r-[3px] border-ink px-[20px] py-[22px]">
            <p className="font-display text-[56px] leading-none">00</p>
            <p className="mt-[8px] text-[11px] font-bold uppercase">Labs</p>
          </div>
          <div className="px-[20px] py-[22px]">
            <p className="font-display text-[56px] leading-none">{studentsReached.toLocaleString()}</p>
            <p className="mt-[8px] text-[11px] font-bold uppercase">Students reached</p>
          </div>
        </section>

        <section className="grid grid-cols-1 border-b-[3px] border-ink md:grid-cols-[minmax(140px,1fr)_4fr]">
          <div className="border-b-[3px] border-ink px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]">
            <h2 className="text-[13px] font-bold uppercase">Events held</h2>
          </div>
          <div>
            {pastEvents.length ? pastEvents.map((event, index) => (
              <article key={event.id} className="grid grid-cols-[70px_minmax(0,1fr)_auto] items-center gap-[16px] border-b-[3px] border-ink px-[18px] py-[16px] last:border-b-0">
                <span className="font-display text-[48px] leading-none">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <a href={`/event?id=${event.id}`} className="font-bold underline-offset-4 hover:underline">{event.title}</a>
                  <p className="mt-[4px] text-[12px] leading-[1.5]">{dateLabel(event.date)} · {event.venue} · {event.attendance ?? 0} attended</p>
                </div>
                {event.writeupId ? <a href={`/writeup?id=${event.writeupId}`} className="text-[11px] font-bold uppercase underline">Writeup ↗</a> : <span className="text-[11px] font-bold uppercase">No writeup yet</span>}
              </article>
            )) : <p className="px-[22px] py-[22px] text-[13px] uppercase">No completed events listed yet.</p>}
          </div>
        </section>

        <section className="border-b-[3px] border-ink">
          <div className="border-b-[3px] border-ink px-[24px] py-[18px]"><h2 className="text-[14px] font-bold uppercase">Writeups</h2></div>
          {writeups.length ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
              {writeups.map((writeup) => (
                <article key={writeup.id} className="border-r-[3px] border-ink p-[24px]">
                  <Tag label={trackLabel(writeup.trackId)} color={trackTagColor(writeup.trackId)} />
                  <h3 className="mt-[14px] text-[19px] font-bold">{writeup.title}</h3>
                  <p className="mt-[8px] text-[13px] leading-[1.5]">{writeup.summary}</p>
                  <a href={`/writeup?id=${writeup.id}`} className="mt-[16px] inline-block text-[12px] font-bold uppercase underline">Read ↗</a>
                </article>
              ))}
            </div>
          ) : <p className="px-[26px] py-[22px] text-[13px] uppercase">No published writeups yet.</p>}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-[minmax(140px,1fr)_4fr]">
          <div className="border-b-[3px] border-ink px-[26px] py-[22px] md:border-b-0 md:border-r-[3px]"><h2 className="text-[13px] font-bold uppercase">Labs authored</h2></div>
          <div className="flex items-center px-[22px] py-[22px]"><span className="bg-ink px-[14px] py-[10px] text-[12px] font-bold uppercase text-white">More soon</span></div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>;
}

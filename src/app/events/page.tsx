"use client";
import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getEvents, type EventWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";

function eventDate(value: EventWithId["date"]) {
  const date = value.toDate();
  return {
    date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    value: date.getTime(),
  };
}

function trackLabel(value: string) {
  return value === "women-in-tech"
    ? "Women in Tech"
    : value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithId[]>([]);
  const [track, setTrack] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setEvents(await getEvents());
      } catch {
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = events.filter((event) => event.status !== "cancelled");
  const tracks = [...new Set(visible.map((event) => event.trackId))];
  const filtered = visible.filter((event) => track === "all" || event.trackId === track);
  const upcoming = useMemo(
    () => filtered.filter((event) => event.status === "upcoming" || event.status === "live")
      .sort((a, b) => eventDate(a.date).value - eventDate(b.date).value),
    [filtered],
  );
  const past = useMemo(
    () => filtered.filter((event) => event.status === "past")
      .sort((a, b) => eventDate(b.date).value - eventDate(a.date).value),
    [filtered],
  );

  const renderEvent = (event: EventWithId, index: number, isPast: boolean) => {
    const date = eventDate(event.date);
    return (
      <article
        key={event.id}
        className={`grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[90px_minmax(0,1fr)_auto] items-center gap-[18px] border-b-[3px] border-ink px-[26px] py-[16px] ${index === 1 ? "bg-red" : "bg-white"}`}
      >
        <span className="font-display text-[56px] leading-[1]">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h2 className="font-bold text-[20px] leading-[1.2]">{event.title}</h2>
          <p className="mt-[4px] text-[13px]">{date.date} · {date.time} · {event.venue}</p>
        </div>
        <div className="col-start-2 sm:col-start-auto flex flex-wrap items-center gap-[12px]">
          <Tag label={trackLabel(event.trackId)} color={trackTagColor(event.trackId)} />
          <a href={isPast && event.writeupId ? `/writeup?id=${event.writeupId}` : `/event?id=${event.id}`} className="text-[12px] font-bold uppercase underline underline-offset-4">
            {isPast ? (event.writeupId ? "Writeup ↗" : "No writeup yet") : "RSVP ↗"}
          </a>
        </div>
      </article>
    );
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Events</h1>
          <p className="mt-[14px] max-w-[600px] text-[17px] leading-[1.5]">
            Sessions, hackathons and meetups across all tracks.
          </p>
        </header>

        <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Filter events by track">
          {[{ id: "all", label: "All" }, ...tracks.map((value) => ({ id: value, label: trackLabel(value) }))].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTrack(item.id)}
              aria-pressed={track === item.id}
              className={`border-r-[3px] border-ink px-[22px] py-[16px] text-[12px] font-bold uppercase ${track === item.id ? "bg-yellow" : "bg-white"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] text-[13px] font-bold">{error}</p>}
        {loading ? (
          <p className="px-[26px] py-[24px] text-[13px] font-bold uppercase">Loading events…</p>
        ) : (
          <>
            <section aria-labelledby="upcoming-heading">
              <h2 id="upcoming-heading" className="border-y-[3px] border-ink px-[26px] py-[18px] text-[14px] font-bold uppercase">Upcoming</h2>
              {upcoming.length ? upcoming.map((event, index) => renderEvent(event, index, false)) : (
                <p className="border-b-[3px] border-ink px-[26px] py-[22px] text-[13px] font-bold uppercase">No upcoming events.</p>
              )}
            </section>
            <section aria-labelledby="past-heading">
              <h2 id="past-heading" className="border-y-[3px] border-ink px-[26px] py-[18px] text-[14px] font-bold uppercase">Past</h2>
              {past.length ? past.map((event, index) => renderEvent(event, index, true)) : (
                <p className="border-b-[3px] border-ink px-[26px] py-[22px] text-[13px] font-bold uppercase">No past events.</p>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

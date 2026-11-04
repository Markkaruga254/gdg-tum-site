"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import SectionHeader from "@/components/SectionHeader";
import StatBlock from "@/components/StatBlock";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import type { AppUser, Event, Writeup } from "@/lib/types";
import { trackTagColor } from "@/lib/tracks";

function formatDateTime(date: unknown): string {
  if (!date || typeof (date as { toDate: () => Date }).toDate !== "function") return "";
  const d = (date as { toDate: () => Date }).toDate();
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

function trackLabel(track: string) {
  return `${track[0].toUpperCase() + track.slice(1)} Track Lead · 2026/27`;
}

function View() {
  const params = useSearchParams();
  const id = params.get("id");
  const [user, setUser] = useState<AppUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    (async () => {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) {
        const u = { id: snap.id, ...snap.data() } as AppUser;
        setUser(u);
        const evSnap = await getDocs(query(collection(db, "events"), where("trackId", "==", u.track)));
        setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Event)));
        const wSnap = await getDocs(query(collection(db, "writeups"), where("status", "==", "published"), where("authorId", "==", id)));
        setWriteups(wSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Writeup)));
      }
      setLoading(false);
    })();
  }, [id]);
  if (loading) return <><Nav /><main className="mx-auto max-w-[1280px] p-6">Loading…</main><Footer /></>;
  if (!user) return <><Nav /><main className="mx-auto max-w-[1280px] p-6">Not found.</main><Footer /></>;
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <section className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] border-b-[3px] border-ink">
          <div className="p-[40px] border-r-[3px] border-ink">
            <Tag label={trackLabel(user.track)} color="blue" />
            <h1 className="font-display font-normal text-[clamp(60px,8vw,112px)] leading-1 uppercase mt-[18px]">
              {user.name}
            </h1>
            <p className="text-[17px] leading-[1.5] max-w-[480px]">{user.bio || "[Bio]"}</p>
            <div className="mt-[22px] flex flex-wrap gap-[8px]">
              {user.links?.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-[3px] border-ink px-[16px] py-[10px] font-bold uppercase text-[13px]"
                >
                  {l.title || l.url} ↗
                </a>
              ))}
            </div>
          </div>
          <div className="bg-blue text-white flex items-center justify-center min-h-[320px]">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="font-display text-[44px] leading-1 uppercase">[Photo]</div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] border-b-[3px] border-ink">
          <StatBlock value={events.length} label="Events held" />
          <StatBlock value={writeups.length} label="Writeups" className="bg-yellow" />
          <StatBlock value={0} label="Labs" />
          <StatBlock value="000" label="Students reached" />
        </section>

        <section className="grid grid-cols-[minmax(140px,1fr)_4fr] border-b-[3px] border-ink">
          <div className="p-[24px] border-r-[3px] border-ink">
            <SectionHeader className="text-[13px]">Events held</SectionHeader>
          </div>
          <div>
            {events.map((e, i) => (
              <div key={e.id} className="grid grid-cols-[70px_1fr_auto] gap-[16px] p-[16px] p-[24px] align-center border-b-[3px] border-ink">
                <span className="font-display text-[48px] leading-1">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="font-bold text-[19px]"><a href={`/event?id=${e.id}`}>{e.title}</a></div>
                  <div className="text-[13px] text-[#444]">
                    {formatDateTime(e.date)} · {e.venue} · {e.attendance ?? 0} attended
                  </div>
                </div>
                <a href={e.writeupId ? `/writeup?id=${e.writeupId}` : "#"} className="text-[13px] font-bold uppercase focus:outline focus:outline-2 focus:outline-ink">
                  Writeup ↗
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b-[3px] border-ink">
          <div className="p-[18px] p-[24px] border-b-[3px] border-ink">
            <SectionHeader className="text-[13px]">Writeups</SectionHeader>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            {writeups.map((w) => (
              <div key={w.id} className="p-[24px] border-r-[3px] border-ink">
                <Tag label={w.trackId} color={trackTagColor(w.trackId)} />
                <div className="font-bold text-[20px] mt-[14px] mb-[8px]">{w.title}</div>
                <div className="text-[14px] leading-[1.5] text-[#333]">{w.summary}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-[minmax(140px,1fr)_4fr]">
          <div className="p-[24px] border-r-[3px] border-ink">
            <SectionHeader className="text-[13px]">Labs authored</SectionHeader>
          </div>
          <div className="p-[20px] p-[24px] flex flex-wrap gap-[12px]">
            {writeups.slice(0, 2).map((w) => (
              <span key={w.id} className="border-[3px] border-ink px-[16px] py-[10px] font-bold uppercase text-[13px]">
                {w.title}
              </span>
            ))}
            <span className="bg-ink text-white px-[16px] py-[13px]">More soon</span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>;
}

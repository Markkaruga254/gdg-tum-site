"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import NumberedRow from "@/components/NumberedRow";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import type { AppUser, Event, Writeup } from "@/lib/types";

function View() {
  const params = useSearchParams();
  const id = params.get("id");
  const [user, setUser] = useState<AppUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false); return; }
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
  if (loading) return <><Nav /><main className="p-6">Loading…</main><Footer /></>;
  if (!user) return <><Nav /><main className="p-6">Not found.</main><Footer /></>;
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <section className="grid grid-cols-1 border-[3px] border-ink md:grid-cols-2">
          <div className="p-6">
            <h1 className="font-display text-5xl uppercase">{user.name}</h1>
            <p className="mt-2 text-sm">[{user.track}] Track Lead</p>
            <p className="mt-4 text-sm">{user.bio || "[Bio]"}</p>
          </div>
          <div className="flex items-center justify-center bg-blue p-6 text-white">
            {user.photoUrl ? <img src={user.photoUrl} alt={user.name} /> : <div className="h-40 w-40 border-[3px] border-white" />}
            {user.links?.map((l: {title:string;url:string}) => <a key={l.url} href={l.url} className="block underline text-sm">{l.title || l.url}</a>)}
          </div>
        </section>
        <section className="mt-4 grid grid-cols-3 border-[3px] border-ink">
          <div className="p-4"><div className="font-display text-3xl">{events.length}</div><div className="text-xs uppercase">Events held</div></div>
          <div className="border-x-[3px] border-ink p-4"><div className="font-display text-3xl">{writeups.length}</div><div className="text-xs uppercase">Writeups</div></div>
          <div className="p-4"><div className="font-display text-3xl">[0]</div><div className="text-xs uppercase">Labs</div></div>
        </section>
        <section className="mt-6">
          <h2 className="font-display text-2xl uppercase">Events held</h2>
          {events.map((e, i) => (
            <NumberedRow key={e.id} n={String(i + 1).padStart(2, "0")}>
              <a href={`/event?id=${e.id}`} className="font-bold">{e.title}</a>
            </NumberedRow>
          ))}
        </section>
        <section className="mt-6">
          <h2 className="font-display text-2xl uppercase">Writeups</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            {writeups.map((w) => (
              <a key={w.id} href={`/writeup?id=${w.id}`} className="border-[3px] border-ink p-3">
                <div className="font-bold">{w.title}</div>
                <Tag label={w.trackId} color="blue" />
              </a>
            ))}
          </div>
        </section>
      </main><Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>;
}

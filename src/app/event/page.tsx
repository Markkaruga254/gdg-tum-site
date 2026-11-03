"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import type { Event } from "@/lib/types";

function EventDetail() {
  const params = useSearchParams();
  const id = params.get("id");
  const [ev, setEv] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false); return; }
    (async () => {
      const snap = await getDoc(doc(db, "events", id));
      if (snap.exists()) setEv({ id: snap.id, ...snap.data() } as Event);
      setLoading(false);
    })();
  }, [id]);
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        {loading && <p>Loading…</p>}
        {!loading && !ev && <p>Event not found.</p>}
        {ev && (
          <>
            <h1 className="font-display text-4xl uppercase">{ev.title}</h1>
            <p className="mt-2">{ev.status}</p>
            <p className="mt-2">{ev.venue}</p>
            {ev.status === "upcoming" && <p className="mt-4">Upcoming</p>}
            {ev.status === "live" && <p className="mt-4">Live now</p>}
            {ev.status === "past" && <p className="mt-4">Past event</p>}
          </>
        )}
      </main><Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><EventDetail /></Suspense>;
}

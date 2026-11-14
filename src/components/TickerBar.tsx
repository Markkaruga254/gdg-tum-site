"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MARQUEE_ITEMS = [
  "GDG ON CAMPUS · TECHNICAL UNIVERSITY OF MOMBASA",
  "BUILD · LEARN · SHIP",
  "COMMUNITY · TECHNOLOGY · INNOVATION",
] as const;

function MarqueeGroup({ message }: { message: string }) {
  return (
    <div className="ticker-marquee__group" aria-hidden="true">
      <span className="ticker-marquee__message">{message}</span>
      <span className="ticker-marquee__separator">◆</span>
      {MARQUEE_ITEMS.map((item, index) => (
        <span className="ticker-marquee__segment" key={item}>
          {index > 0 && <span className="ticker-marquee__separator">◆</span>}
          <span className="ticker-marquee__item">{item}</span>
        </span>
      ))}
      <span className="ticker-marquee__separator">◆</span>
      <span className="ticker-marquee__message">{message}</span>
    </div>
  );
}

export default function TickerBar() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const activeTicker = query(
      collection(db, "ticker"),
      where("status", "==", "active"),
      orderBy("updatedAt", "desc"),
      limit(1),
    );
    const unsubscribe = onSnapshot(
      activeTicker,
      (snapshot) => setMessage(snapshot.empty ? null : snapshot.docs[0].data().message as string),
      () => setMessage(null),
    );
    return unsubscribe;
  }, []);

  if (!message) return null;

  return (
    <section className="ticker-bar" aria-label="Live event update">
      <div className="ticker-bar__inner">
        <span className="ticker-bar__badge" aria-hidden="true">Live now</span>
        <span className="sr-only" role="status" aria-live="polite">
          Live event update: {message}
        </span>
        <div className="ticker-marquee" data-testid="ticker-marquee">
          <div className="ticker-marquee__track">
            <MarqueeGroup message={message} />
            <MarqueeGroup message={message} />
          </div>
        </div>
      </div>
    </section>
  );
}

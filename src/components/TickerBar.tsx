"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-[12px] bg-ink px-[20px] py-[12px] text-[12px] font-bold uppercase tracking-[.5px] text-white xl:gap-[14px] xl:px-[22px] xl:text-[13px]"
    >
      <span className="bg-green px-[10px] py-[3px] text-ink">Live now</span>
      <span>{message}</span>
      <span className="ml-auto hidden text-yellow xl:block">Updated by track leads in real time</span>
    </div>
  );
}

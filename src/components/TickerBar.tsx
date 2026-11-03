"use client";
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TickerBar() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const q = query(collection(db, "ticker"), where("status", "==", "active"), orderBy("updatedAt", "desc"), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) setMsg(null);
      else setMsg(snap.docs[0].data().message as string);
    });
    return () => unsub();
  }, []);
  if (!msg) return null;
  return (
    <div className="flex items-center gap-3 border-b-[3px] border-ink bg-ink px-4 py-2 text-white">
      <span className="bg-green px-2 py-0.5 text-xs font-bold uppercase text-ink">Live now</span>
      <span className="text-sm">{msg}</span>
    </div>
  );
}

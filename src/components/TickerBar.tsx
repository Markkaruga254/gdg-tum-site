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
    <div className="flex items-center gap-[14px] bg-ink text-white px-[22px] py-[12px] text-[13px] font-bold uppercase tracking-[.5px] flex-wrap">
      <span className="bg-green text-ink px-[10px] py-[3px]">Live now</span>
      <span>{msg}</span>
      <span className="ml-auto text-yellow">Updated by track leads in real time</span>
    </div>
  );
}

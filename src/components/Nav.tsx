"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInGoogle, signOut } from "@/lib/auth";

const links = [
  { href: "/events", label: "Events" },
  { href: "/tracks", label: "Tracks" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/writeups", label: "Writeups" },
  { href: "/leads", label: "Leads" },
  { href: "/labs", label: "Labs" },
];

export default function Nav() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setName(u?.displayName ?? null));
    return () => unsub();
  }, []);
  return (
    <nav className="grid grid-cols-[1fr_auto] border-b-[3px] border-ink">
      <div className="flex items-center border-r-[3px] border-ink px-4 py-3 font-display text-xl uppercase">
        <Link href="/">GDG.TUM</Link>
      </div>
      <div className="flex items-center gap-4 px-4 py-3 text-sm font-bold uppercase">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="focus:outline focus:outline-2 focus:outline-ink">{l.label}</Link>
        ))}
        {name ? (
          <>
            <span>{name}</span>
            <button onClick={() => signOut()} className="border-[3px] border-ink px-3 py-1">Sign out</button>
          </>
        ) : (
          <button onClick={() => signInGoogle()} className="border-[3px] border-ink bg-yellow px-3 py-1 text-ink">Sign in</button>
        )}
        <Link href="/tracks" className="border-[3px] border-ink bg-yellow px-3 py-1 text-ink">Join a track</Link>
      </div>
    </nav>
  );
}

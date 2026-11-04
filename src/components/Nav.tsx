"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInGoogle, signOut } from "@/lib/auth";

const links = [
  { href: "/events", label: "Events" },
  { href: "/tracks", label: "Tracks" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/leads", label: "Leads" },
  { href: "/labs", label: "Labs" },
];

export default function Nav({ home = false }: { home?: boolean } = {}) {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setName(u?.displayName ?? null));
    return () => unsub();
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="flex flex-wrap border-b-[3px] border-ink">
      <Link
        href="/"
        className="flex items-center border-r-[3px] border-ink px-[14px] py-[22px] font-display text-[30px] uppercase leading-[1] tracking-[1px]"
      >
        GDG<span className="text-blue">.</span>TUM
      </Link>
      {home && (
        <span className="border-r-[3px] border-ink px-[14px] py-[22px] text-[11px] font-bold uppercase leading-[1.3] max-w-[150px]">
          Google Developer Group on Campus
        </span>
      )}
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`border-r-[3px] border-ink px-[22px] py-[20px] text-[12px] font-bold uppercase whitespace-nowrap ${isActive(l.href) ? "bg-yellow" : ""}`}
        >
          {l.label}
        </Link>
      ))}
      {name ? (
        <span className="border-r-[3px] border-ink px-[22px] py-[20px] text-[12px] font-bold uppercase whitespace-nowrap flex items-center gap-2">
          {name}
          <button onClick={() => signOut()} className="border-[3px] border-ink bg-ink px-[3px] py-[1px] text-white text-[12px] font-bold uppercase">Sign out</button>
        </span>
      ) : (
        <span className="border-r-[3px] border-ink px-[22px] py-[20px] text-[12px] font-bold uppercase whitespace-nowrap">
          <button onClick={() => signInGoogle()} className="border-[3px] border-ink bg-ink px-[3px] py-[1px] text-white text-[12px] font-bold uppercase">Sign in</button>
        </span>
      )}
      <Link
        href="/tracks"
        className="ml-auto border-l-[3px] border-ink bg-yellow px-[22px] py-[24px] text-[12px] font-bold uppercase whitespace-nowrap"
      >
        Join a track ↗
      </Link>
    </nav>
  );
}

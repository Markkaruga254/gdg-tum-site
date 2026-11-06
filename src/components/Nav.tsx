"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInGoogle, signOut } from "@/lib/auth";

const pageLinks = [
  { href: "/events", label: "Events" },
  { href: "/tracks", label: "Tracks" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/leads", label: "Leads" },
  { href: "/labs", label: "Labs" },
];

export default function Nav({ home = false }: { home?: boolean } = {}) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUserName(user ? (user.displayName || "Account") : null));
    return () => unsub();
  }, []);

  const links = pageLinks;

  return (
    <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Main navigation">
      <Link
        href="/"
        className="flex items-center border-r-[3px] border-ink px-[22px] py-[14px] font-display text-[30px] uppercase leading-[1] tracking-[1px]"
      >
        GDG<span className="text-blue">.</span>TUM
      </Link>
      {home && (
        <span className="max-w-[150px] border-r-[3px] border-ink px-[18px] py-[14px] text-[11px] font-bold uppercase leading-[1.3]">
          Google Developer Group on Campus
        </span>
      )}
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className={`border-r-[3px] border-ink px-[20px] py-[22px] text-[13px] font-bold uppercase whitespace-nowrap ${pathname === link.href ? "bg-yellow" : ""}`}
        >
          {link.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => (userName ? signOut() : signInGoogle())}
        className="border-r-[3px] border-ink px-[20px] py-[22px] text-[12px] font-bold uppercase whitespace-nowrap"
      >
        {userName ? `${userName} · Sign out` : "Sign in"}
      </button>
      <Link
        href="/tracks"
        className="ml-auto border-l-[3px] border-ink bg-yellow px-[24px] py-[22px] text-[13px] font-bold uppercase whitespace-nowrap"
      >
        Join a track ↗
      </Link>
    </nav>
  );
}

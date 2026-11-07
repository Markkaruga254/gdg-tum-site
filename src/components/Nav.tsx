"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signOut } from "@/lib/auth";

const pageLinks = [
  { href: "/events", label: "Events" },
  { href: "/tracks", label: "Tracks" },
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/leads", label: "Leads" },
  { href: "/labs", label: "Labs" },
];

const cellClass = "flex items-center border-r-[3px] border-ink px-[20px] py-[22px] text-[12px] font-bold uppercase tracking-[.5px] whitespace-nowrap";

export default function Nav({ home = false }: { home?: boolean } = {}) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserName(user ? user.displayName || "Account" : null);
    });
    return unsubscribe;
  }, []);

  const activePath = pathname === "/lead" ? "/leads"
    : pathname === "/track" ? "/tracks"
    : pathname === "/event" ? "/events"
    : pathname;

  return (
    <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Main navigation">
      <Link
        href="/"
        aria-label="GDG on Campus TUM home"
        className="flex items-center border-r-[3px] border-ink px-[22px] py-[14px] font-display text-[30px] uppercase leading-none tracking-[1px]"
      >
        GDG<span className="text-blue">.</span>TUM
      </Link>

      {home && (
        <span className="flex max-w-[150px] items-center border-r-[3px] border-ink px-[18px] py-[14px] text-[11px] font-bold uppercase leading-[1.3]">
          Google Developer Group on Campus
        </span>
      )}

      {pageLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={activePath === link.href ? "page" : undefined}
          className={`${cellClass} ${activePath === link.href ? "bg-yellow" : "bg-white"}`}
        >
          {link.label}
        </Link>
      ))}

      {userName ? (
        <span className="flex items-center gap-[6px] border-r-[3px] border-ink px-[20px] py-[22px] text-[12px] font-bold uppercase tracking-[.5px]">
          <span className="max-w-[150px] break-words">{userName}</span>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => void signOut()} className="underline underline-offset-2">
            Sign out
          </button>
        </span>
      ) : (
        <Link
          href="/login"
          aria-current={pathname === "/login" ? "page" : undefined}
          className={`${cellClass} ${pathname === "/login" ? "bg-yellow" : "bg-white"}`}
        >
          Sign in
        </Link>
      )}

      <Link
        href="/tracks"
        className="ml-auto flex items-center border-l-[3px] border-ink bg-yellow px-[20px] py-[22px] text-[12px] font-bold uppercase tracking-[.5px] whitespace-nowrap"
      >
        Join a track ↗
      </Link>
    </nav>
  );
}

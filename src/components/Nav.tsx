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

export default function Nav({ home = false }: { home?: boolean } = {}) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUserName(user ? (user.displayName || "Account") : null));
    return () => unsub();
  }, []);

  const activePath = pathname === "/lead" ? "/leads"
    : pathname === "/track" ? "/tracks"
    : pathname === "/event" ? "/events"
    : pathname;

  return (
    <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Main navigation">
      <Link
        href="/"
        className="flex flex-1 items-center border-r-[3px] border-ink px-[16px] py-[12px] font-display text-[26px] uppercase leading-[1] tracking-[1px] xl:flex-none xl:px-[22px] xl:py-[14px] xl:text-[30px]"
      >
        GDG<span className="text-blue">.</span>TUM
      </Link>

      {home && (
        <span className="hidden max-w-[150px] border-r-[3px] border-ink px-[18px] py-[14px] text-[11px] font-bold uppercase leading-[1.3] xl:block">
          Google Developer Group on Campus
        </span>
      )}

      <div className="hidden xl:flex">
        {pageLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={activePath === link.href ? "page" : undefined}
            className={`whitespace-nowrap border-r-[3px] border-ink px-[20px] py-[22px] text-[13px] font-bold uppercase ${activePath === link.href ? "bg-yellow" : ""}`}
          >
            {link.label}
          </Link>
        ))}
        {userName ? (
          <button type="button" onClick={() => void signOut()} className="whitespace-nowrap border-r-[3px] border-ink px-[20px] py-[22px] text-[12px] font-bold uppercase">
            {userName} · Sign out
          </button>
        ) : (
          <Link href="/login" className={`whitespace-nowrap border-r-[3px] border-ink px-[20px] py-[22px] text-[12px] font-bold uppercase ${pathname === "/login" ? "bg-yellow" : ""}`}>
            Sign in
          </Link>
        )}
      </div>

      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="mobile-site-menu"
        onClick={() => setMenuOpen((open) => !open)}
        className="border-r-[3px] border-ink px-[16px] py-[22px] text-[12px] font-bold uppercase xl:hidden"
      >
        {menuOpen ? "Close" : "Menu"}
      </button>

      <Link href="/tracks" className="bg-yellow px-[14px] py-[22px] text-[12px] font-bold uppercase whitespace-nowrap xl:ml-auto xl:px-[24px] xl:text-[13px]">
        <span className="xl:hidden">Join ↗</span>
        <span className="hidden xl:inline">Join a track ↗</span>
      </Link>

      {menuOpen && (
        <div id="mobile-site-menu" className="grid w-full grid-cols-2 border-t-[3px] border-ink xl:hidden">
          {pageLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={activePath === link.href ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`border-b-[3px] border-r-[3px] border-ink px-[16px] py-[16px] text-[12px] font-bold uppercase ${activePath === link.href ? "bg-yellow" : "bg-white"}`}
            >
              {link.label}
            </Link>
          ))}
          {userName ? (
            <button type="button" onClick={() => { setMenuOpen(false); void signOut(); }} className="border-b-[3px] border-r-[3px] border-ink px-[16px] py-[16px] text-left text-[12px] font-bold uppercase">Sign out · {userName}</button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="border-b-[3px] border-r-[3px] border-ink px-[16px] py-[16px] text-[12px] font-bold uppercase">Sign in</Link>
          )}
        </div>
      )}
    </nav>
  );
}

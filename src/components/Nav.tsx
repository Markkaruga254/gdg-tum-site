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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        onClick={() => setMobileMenuOpen(false)}
        aria-label="GDG on Campus TUM home"
        className={`flex items-center ${home ? "flex-1 md:flex-none" : "flex-none"} border-r-[3px] border-ink px-[16px] py-[12px] font-display text-[26px] uppercase leading-none tracking-[1px] md:px-[22px] md:py-[14px] md:text-[30px]`}
      >
        GDG<span className="text-blue">.</span>TUM
      </Link>

      {home && (
        <span className="hidden max-w-[150px] items-center border-r-[3px] border-ink px-[18px] py-[14px] text-[11px] font-bold uppercase leading-[1.3] md:flex">
          Google Developer Group on Campus
        </span>
      )}

      {home && (
        <button
          type="button"
          aria-controls="mobile-navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex items-center border-r-[3px] border-ink px-[16px] py-[22px] text-[12px] font-bold uppercase tracking-[.5px] md:hidden"
        >
          Menu
        </button>
      )}

      {pageLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setMobileMenuOpen(false)}
          aria-current={activePath === link.href ? "page" : undefined}
          className={`${cellClass} ${home ? "hidden md:flex" : "flex"} ${activePath === link.href ? "bg-yellow" : "bg-white"}`}
        >
          {link.label}
        </Link>
      ))}

      {userName ? (
        <span className="hidden items-center gap-[6px] border-r-[3px] border-ink px-[20px] py-[22px] text-[12px] font-bold uppercase tracking-[.5px] md:flex">
          <span className="max-w-[150px] break-words">{userName}</span>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => void signOut()} className="underline underline-offset-2">
            Sign out
          </button>
        </span>
      ) : (
        <Link
          href="/login"
          onClick={() => setMobileMenuOpen(false)}
          aria-current={pathname === "/login" ? "page" : undefined}
          className={`${cellClass} ${home ? "hidden md:flex" : "flex"} ${pathname === "/login" ? "bg-yellow" : "bg-white"}`}
        >
          Sign in
        </Link>
      )}

      <Link
        href="/tracks"
        onClick={() => setMobileMenuOpen(false)}
        className={`ml-auto flex items-center ${home ? "border-l-0 md:border-l-[3px]" : "border-l-[3px]"} border-ink bg-yellow px-[14px] py-[22px] text-[12px] font-bold uppercase tracking-[.5px] whitespace-nowrap md:px-[20px]`}
      >
        {home && <span className="md:hidden">Join ↗</span>}
        <span className={home ? "hidden md:inline" : "inline"}>Join a track ↗</span>
      </Link>

      {home && mobileMenuOpen && (
        <div id="mobile-navigation" className="flex basis-full flex-col border-t-[3px] border-ink md:hidden">
          {pageLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={activePath === link.href ? "page" : undefined}
              className={`border-b-[3px] border-ink px-[18px] py-[15px] text-[12px] font-bold uppercase tracking-[.5px] ${activePath === link.href ? "bg-yellow" : "bg-white"}`}
            >
              {link.label}
            </Link>
          ))}
          {userName ? (
            <button type="button" onClick={() => { setMobileMenuOpen(false); void signOut(); }} className="bg-white px-[18px] py-[15px] text-left text-[12px] font-bold uppercase tracking-[.5px]">
              Sign out · {userName}
            </button>
          ) : (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={`px-[18px] py-[15px] text-[12px] font-bold uppercase tracking-[.5px] ${pathname === "/login" ? "bg-yellow" : "bg-white"}`}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

type DashboardRole = "lead" | "admin" | string;

type DashboardNavigationProps = {
  role: DashboardRole;
  tab: string;
  track: string;
  onTabChange: (tab: string) => void;
};

type NavigationItem = {
  tab: string;
  label: string;
};

const PRIMARY_ITEMS: NavigationItem[] = [
  { tab: "Overview", label: "Overview" },
  { tab: "Track events", label: "Events" },
  { tab: "New writeup", label: "New writeup" },
];

const SECONDARY_ITEMS: NavigationItem[] = [
  { tab: "Media", label: "My media" },
  { tab: "Live ticker", label: "Live ticker" },
  { tab: "My profile", label: "My profile" },
];

export default function LeadDashboardNavigation({
  role,
  tab,
  track,
  onTabChange,
}: DashboardNavigationProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const items = [
    ...PRIMARY_ITEMS,
    ...SECONDARY_ITEMS,
    ...(role === "admin"
      ? [
          { tab: "Gallery", label: "Gallery manager" },
          { tab: "Partners", label: "Partners" },
        ]
      : []),
  ];
  const secondaryItems = items.filter(
    (item) => !PRIMARY_ITEMS.some((primary) => primary.tab === item.tab),
  );
  const moreIsActive = secondaryItems.some((item) => item.tab === tab);

  function selectTab(nextTab: string) {
    onTabChange(nextTab);
    setMoreOpen(false);
  }

  function renderItem(item: NavigationItem, mobile = false) {
    const active = tab === item.tab;
    return (
      <button
        key={item.tab}
        type="button"
        onClick={() => selectTab(item.tab)}
        aria-current={active ? "page" : undefined}
        className={[
          "w-full border-b-[3px] border-ink text-left font-bold uppercase",
          mobile
            ? "px-[16px] py-[13px] text-[11px]"
            : "px-[14px] py-[16px] text-[11px] sm:px-[18px]",
          active ? "bg-yellow" : "bg-white hover:bg-[#f3f3f3]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-blue",
        ].join(" ")}
      >
        {item.label}
      </button>
    );
  }

  return (
    <>
      <aside
        data-testid="dashboard-sidebar"
        aria-label="Dashboard sections"
        className="hidden min-w-0 border-r-[3px] border-ink md:sticky md:top-0 md:block md:self-start"
      >
        {items.map((item) => renderItem(item))}
        {role === "lead" && track && (
          <Link
            href={`/track?slug=${encodeURIComponent(track)}`}
            className="block border-b-[3px] border-ink bg-white px-[14px] py-[16px] text-[11px] font-bold uppercase hover:bg-[#f3f3f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-5px] focus-visible:outline-blue sm:px-[18px]"
          >
            My track ↗
          </Link>
        )}
      </aside>

      <nav
        aria-label="Mobile dashboard navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_0_rgba(0,0,0,0.08)] md:hidden"
      >
        <div className="grid grid-cols-4">
          {PRIMARY_ITEMS.map((item) => {
            const active = tab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => selectTab(item.tab)}
                aria-current={active ? "page" : undefined}
                className={[
                  "min-w-0 px-1 py-[13px] text-center text-[10px] font-bold uppercase",
                  active ? "bg-yellow" : "bg-white",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="mobile-dashboard-more"
            aria-current={moreIsActive ? "page" : undefined}
            onClick={() => setMoreOpen((open) => !open)}
            className={[
              "min-w-0 px-1 py-[13px] text-center text-[10px] font-bold uppercase",
              moreIsActive || moreOpen ? "bg-yellow" : "bg-white",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue",
            ].join(" ")}
          >
            More {moreOpen ? "−" : "+"}
          </button>
        </div>

        {moreOpen && (
          <div
            id="mobile-dashboard-more"
            className="absolute bottom-full right-[12px] mb-[10px] w-[min(280px,calc(100vw-24px))] border-[3px] border-ink bg-white shadow-[6px_6px_0_#111]"
          >
            <p className="border-b-[3px] border-ink bg-ink px-[14px] py-[11px] text-[10px] font-bold uppercase tracking-[.08em] text-white">
              More workspace
            </p>
            {secondaryItems.map((item) => renderItem(item, true))}
            {role === "lead" && track && (
              <Link
                href={`/track?slug=${encodeURIComponent(track)}`}
                onClick={() => setMoreOpen(false)}
                className="block border-b-[3px] border-ink bg-white px-[16px] py-[13px] text-[11px] font-bold uppercase hover:bg-[#f3f3f3]"
              >
                My track ↗
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

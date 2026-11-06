"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function OverviewTab({ events, writeups, setTab }: any) {
  return (
    <section>
                  <h1 className="font-display text-[clamp(42px,6vw,64px)] uppercase leading-none">Overview</h1>
                  <p className="mt-[12px] text-[14px] leading-[1.5]">Your track workspace. Manage events, publish writeups and keep your community updated.</p>
                  <div className="mt-[24px] grid grid-cols-2 border-l-[3px] border-t-[3px] border-ink sm:grid-cols-3">
                    <div className="border-b-[3px] border-r-[3px] border-ink p-[18px]"><p className="font-display text-[48px] leading-none">{events.length}</p><p className="mt-[8px] text-[11px] font-bold uppercase">Events</p></div>
                    <div className="border-b-[3px] border-r-[3px] border-ink bg-yellow p-[18px]"><p className="font-display text-[48px] leading-none">{writeups.length}</p><p className="mt-[8px] text-[11px] font-bold uppercase">Your writeups</p></div>
                    <div className="border-b-[3px] border-r-[3px] border-ink p-[18px]"><p className="font-display text-[48px] leading-none">{writeups.filter((item: any) => item.status === "published").length}</p><p className="mt-[8px] text-[11px] font-bold uppercase">Published</p></div>
                  </div>
                  <div className="mt-[22px] flex flex-wrap gap-[10px]">
                    <button type="button" onClick={() => setTab("New writeup")} className="border-[3px] border-ink bg-yellow px-[18px] py-[12px] text-[12px] font-bold uppercase">New writeup ↗</button>
                    <button type="button" onClick={() => setTab("My events")} className="border-[3px] border-ink px-[18px] py-[12px] text-[12px] font-bold uppercase">Manage events ↗</button>
                  </div>
                </section>
  );
}

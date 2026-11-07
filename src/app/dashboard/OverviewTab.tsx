"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { canManageWriteup } from "@/lib/permissions";

export default function OverviewTab({ events, writeups, setTab, startEditWriteup, startNewWriteup, unpublish, publishWriteup, deleteWriteup, role, uid, track }: any) {
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
        <button type="button" onClick={startNewWriteup} className="border-[3px] border-ink bg-yellow px-[18px] py-[12px] text-[12px] font-bold uppercase">New writeup ↗</button>
        <button type="button" onClick={() => setTab("My events")} className="border-[3px] border-ink px-[18px] py-[12px] text-[12px] font-bold uppercase">Manage events ↗</button>
      </div>
      <details className="mt-[24px] border-[3px] border-ink">
        <summary className="cursor-pointer bg-ink px-[16px] py-[12px] text-[12px] font-bold uppercase text-white">
          My writeups ({writeups.length})
        </summary>
        <div className="grid gap-0">
          {writeups.length === 0 && <p className="p-[16px] text-[13px]">You have not created any writeups yet.</p>}
          {writeups.map((writeup: any, index: number) => (
            <div key={writeup.id} className={`flex flex-wrap items-center justify-between gap-[12px] border-b-[3px] border-ink p-[14px] ${index % 2 === 1 ? "bg-[#f7f7f7]" : "bg-white"}`}>
              <div className="min-w-0">
                <p className="text-[13px] font-bold">{writeup.title}</p>
                <p className="mt-[4px] text-[10px] font-bold uppercase text-[#555]">{writeup.status} · {writeup.trackId || "General"}</p>
              </div>
              <div className="flex flex-wrap gap-[7px]">
                {canManageWriteup(role, uid, track, writeup) && (
                  <>
                    <button type="button" onClick={() => startEditWriteup(writeup)} data-testid={`edit-writeup-${writeup.id}`} className="border-[2px] border-ink px-[10px] py-[7px] text-[10px] font-bold uppercase">Edit</button>
                    {writeup.status === "published" ? (
                      <button type="button" onClick={() => unpublish(writeup.id)} className="border-[2px] border-ink px-[10px] py-[7px] text-[10px] font-bold uppercase">Unpublish</button>
                    ) : (
                      <button type="button" onClick={() => publishWriteup(writeup.id)} className="border-[2px] border-ink bg-ink px-[10px] py-[7px] text-[10px] font-bold uppercase text-white">Publish</button>
                    )}
                  </>
                )}
                {role === "admin" && <button type="button" onClick={() => deleteWriteup(writeup.id)} className="border-[2px] border-ink px-[10px] py-[7px] text-[10px] font-bold uppercase">Delete</button>}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

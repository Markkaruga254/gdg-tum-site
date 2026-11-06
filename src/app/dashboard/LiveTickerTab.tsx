"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getTicker } from "@/lib/data";

export default function LiveTickerTab({ uid, role, events, track, setMsg, setErr }: any) {
  return (
    <section>
                  <h2 className="font-display text-2xl uppercase">Live ticker</h2>
                  <TickerTab uid={uid} role={role} events={events} track={track} setMsg={setMsg} setErr={setErr} />
                </section>
  );
}

export function TickerTab({ uid, role, events, track, setMsg, setErr }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState({ eventId: "", message: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    try {
      const fetched = await getTicker();
      setEntries(fetched as any[]);
    } catch (error: any) {
      setErr(error?.message || "Ticker entries could not be loaded.");
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [uid, track]);

  async function goLive(id: string) {
    try {
      const ev = events.find((event: any) => event.id === entries.find((item) => item.id === id)?.eventId);
      const currentTrack = ev?.trackId || track;
      for (const entry of entries) {
        if (entry.id !== id && entry.status === "active") {
          const otherEvent = events.find((event: any) => event.id === entry.eventId);
          if ((otherEvent?.trackId || track) === currentTrack) {
            await updateDoc(doc(db, "ticker", entry.id), { status: "inactive", updatedAt: serverTimestamp() });
          }
        }
      }
      await updateDoc(doc(db, "ticker", id), { status: "active", updatedAt: serverTimestamp() });
      setMsg("Ticker is live.");
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker could not be made live.");
    }
  }

  async function end(id: string) {
    try {
      await updateDoc(doc(db, "ticker", id), { status: "inactive", updatedAt: serverTimestamp() });
      setMsg("Ticker entry ended.");
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker entry could not be ended.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this ticker entry?")) return;
    try {
      await deleteDoc(doc(db, "ticker", id));
      setMsg("Ticker entry deleted.");
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker entry could not be deleted.");
    }
  }

  function startEdit(entry: any) {
    setEditingId(entry.id);
    setForm({ eventId: entry.eventId, message: entry.message });
  }

  async function save(e: any) {
    e.preventDefault();
    if (!form.eventId || !form.message.trim()) {
      setErr("Event and message are required.");
      return;
    }
    if (form.message.length > 140) {
      setErr("Message must be 140 characters or fewer.");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, "ticker", editingId), { message: form.message.trim(), updatedAt: serverTimestamp() });
        setMsg("Ticker entry updated.");
      } else {
        await addDoc(collection(db, "ticker"), { eventId: form.eventId, message: form.message.trim(), status: "inactive", createdBy: uid, updatedAt: serverTimestamp() });
        setMsg("Ticker entry created.");
      }
      setEditingId(null);
      setForm({ eventId: "", message: "" });
      await load();
    } catch (error: any) {
      setErr(error?.message || "Ticker entry could not be saved.");
    }
  }

  return (
    <div>
      <form onSubmit={save} className="grid gap-2 border-[3px] border-ink p-[16px]">
        <label htmlFor="ticker-event" className="text-[11px] font-bold uppercase">Event</label>
        <select id="ticker-event" value={form.eventId} disabled={Boolean(editingId)} onChange={(event) => setForm({ ...form, eventId: event.target.value })} className="border-[3px] border-ink px-3 py-2 disabled:bg-[#f5f5f5]">
          <option value="">Select event</option>
          {events.map((event: any) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
        <label htmlFor="ticker-message" className="text-[11px] font-bold uppercase">Message</label>
        <input id="ticker-message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} maxLength={140} placeholder="Live update" className="border-[3px] border-ink px-3 py-2" />
        <p className="text-xs">{form.message.length}/140</p>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{editingId ? "Save changes" : "Create entry"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ eventId: "", message: "" }); }} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">Cancel edit</button>}
        </div>
      </form>
      <div className="mt-4 grid gap-2">
        {entries.map((entry: any) => {
          const canManage = role === "admin" || entry.createdBy === uid;
          return (
            <article key={entry.id} className="border-[3px] border-ink p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="font-bold">{entry.message}</p><p className="mt-1 text-xs font-bold uppercase">{entry.status}</p></div>
                <p className="text-xs">{events.find((event: any) => event.id === entry.eventId)?.title || "Event"}</p>
              </div>
              {canManage && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.status !== "active" && <button type="button" onClick={() => void goLive(entry.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Go live</button>}
                  {entry.status === "active" && <button type="button" onClick={() => void end(entry.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">End</button>}
                  <button type="button" onClick={() => startEdit(entry)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Edit</button>
                  <button type="button" onClick={() => void remove(entry.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

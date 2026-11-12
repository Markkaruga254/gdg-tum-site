"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import FormField from "@/components/form/FormField";
import type { EventForm } from "@/lib/validators";
import { TRACKS } from "@/lib/tracks";

export default function MyEventsTab({ events, role, eventForm, setEventForm, eventErrors, saveEvent, saving, editingEvent, setEditingEvent, startEditEvent, cancelEvent, deleteEvent }: any) {
  return (
    <section>
                  <h2 className="font-display text-2xl uppercase">Track events</h2>
                  <form onSubmit={(e) => { e.preventDefault(); saveEvent(); }} className="mt-4 grid gap-2">
                    <FormField label="Title" id="et" error={eventErrors.title}>
                      <input id="et" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value } as any)} className="border-[3px] border-ink px-3 py-2" />
                    </FormField>
                    <FormField label="Date" id="ed" error={eventErrors.date}>
                      <input id="ed" type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                    </FormField>
                    <FormField label="Venue" id="ev" error={eventErrors.venue}>
                      <input id="ev" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                    </FormField>
                    <FormField label="Description (optional)" id="event-description">
                      <textarea id="event-description" rows={3} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                    </FormField>
                    <FormField label="Status" id="es">
                      <select id="es" value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as EventForm["status"] })} className="border-[3px] border-ink px-3 py-2">
                        <option value="upcoming">upcoming</option><option value="live">live</option><option value="past">past</option><option value="cancelled">cancelled</option>
                      </select>
                    </FormField>
                    {role === "admin" && (
                      <FormField label="Track" id="etr" error={eventErrors.trackId}>
                        <select id="etr" value={eventForm.trackId} onChange={(e) => setEventForm({ ...eventForm, trackId: e.target.value })} className="border-[3px] border-ink px-3 py-2">
                          <option value="">select</option>{TRACKS.map((track) => <option key={track.slug} value={track.slug}>{track.name}</option>)}
                        </select>
                      </FormField>
                    )}
                    <FormField label="Attendance" id="ea">
                      <input id="ea" type="number" min={0} value={eventForm.attendance} onChange={(e) => setEventForm({ ...eventForm, attendance: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                    </FormField>
                    <button disabled={saving} className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{saving ? "Saving..." : (editingEvent ? "Update event" : "Create event")}</button>
                    {editingEvent && <button type="button" onClick={() => { setEditingEvent(null); setEventForm({ title: "", date: "", venue: "", description: "", status: "upcoming", attendance: "", trackId: "" }); }} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">Cancel</button>}
                  </form>
                  <div className="mt-4">
                    {events.length === 0 && <p>No events.</p>}
                    {events.map((ev: any) => (
                      <div key={ev.id} className="border-[3px] border-ink p-3 mt-2">
                        <div className="font-bold">{ev.title} — {ev.status}</div>
                        <div className="text-sm">{ev.venue} · {ev.date?.toDate ? ev.date.toDate().toLocaleString() : ev.date}</div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => startEditEvent(ev)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Edit</button>
                          <button onClick={() => cancelEvent(ev.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Cancel event</button>
                          {role === "admin" && <button onClick={() => deleteEvent(ev.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
  );
}

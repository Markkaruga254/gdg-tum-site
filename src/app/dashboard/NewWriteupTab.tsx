"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import FormField from "@/components/form/FormField";
import ReactMarkdown from "react-markdown";

const TOPIC_TAGS = ["cloud", "cybersecurity", "web", "mobile", "ai-ml", "data", "devops", "open-source", "careers"];
const PRODUCT_TAGS = ["android", "firebase", "flutter", "gemini", "chrome", "google-cloud"];

export default function NewWriteupTab({ editingWriteup, setEditingWriteup, wf, setWf, wfErrors, events, saveWriteup, saving, mediaList, setMediaList, aiPhotoIds, setAiPhotoIds, aiConsent, setAiConsent, setTab, preview, setPreview, writeups, startEditWriteup, unpublish, publishWriteup, deleteWriteup, role, topicTags, setTopicTags, productTags, setProductTags }: any) {
  return (
    <section>
                  <div className="flex flex-wrap items-center justify-between gap-[12px]">
                    <h2 className="font-display text-[clamp(42px,6vw,56px)] uppercase leading-none">{editingWriteup ? "Edit writeup" : "New writeup"}</h2>
                    {editingWriteup && <button type="button" onClick={() => { setEditingWriteup(null); setWf({ eventId: "", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }] }); setMediaList([]); setAiConsent(false); setAiPhotoIds([]); setTopicTags([]); setProductTags([]); }} className="border-[3px] border-ink px-[12px] py-[9px] text-[11px] font-bold uppercase">Start new writeup</button>}
                  </div>
                  <div className="mt-[20px] grid grid-cols-1 border-[3px] border-ink sm:grid-cols-3">
                    <div className="border-b-[3px] border-ink bg-ink px-[14px] py-[13px] text-[11px] font-bold uppercase text-white sm:border-b-0 sm:border-r-[3px]">1&nbsp; Add your notes</div>
                    <div className="border-b-[3px] border-ink bg-yellow px-[14px] py-[13px] text-[11px] font-bold uppercase sm:border-b-0 sm:border-r-[3px]">2&nbsp; AI draft</div>
                    <div className="px-[14px] py-[13px] text-[11px] font-bold uppercase">3&nbsp; Review &amp; publish</div>
                  </div>
                  <div className="mt-[20px] grid grid-cols-1 gap-0 border-[3px] border-ink lg:grid-cols-2">
                    <form onSubmit={(e) => { e.preventDefault(); saveWriteup(false); }} className="grid content-start gap-[12px] p-[18px] sm:p-[24px]">
                      <FormField label="Event" id="we" error={wfErrors.eventId}>
                        <select id="we" value={wf.eventId} onChange={(e) => setWf({ ...wf, eventId: e.target.value })} className="border-[3px] border-ink px-3 py-2">
                          <option value="">select</option>
                          {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Title" id="wt" error={wfErrors.title}>
                        <input id="wt" value={wf.title} onChange={(e) => setWf({ ...wf, title: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                      </FormField>
                      <FormField label="Summary (max 40 words)" id="ws" error={wfErrors.summary}>
                        <textarea id="ws" value={wf.summary} onChange={(e) => setWf({ ...wf, summary: e.target.value })} className="border-[3px] border-ink px-3 py-2" rows={3} />
                        <p className="text-right text-[10px] font-bold uppercase">{wf.summary.trim() ? wf.summary.trim().split(/\s+/).length : 0}/40 words</p>
                      </FormField>
                      <FormField label="Attendance" id="wa" error={wfErrors.attendance}>
                        <input id="wa" type="number" min={0} value={wf.attendance} onChange={(e) => setWf({ ...wf, attendance: e.target.value })} className="border-[3px] border-ink px-3 py-2" />
                      </FormField>
                      <FormField label="Links" id="wl" error={wfErrors.links}>
                        <div className="grid gap-2">
                          {wf.links.map((l: any, i: number) => (
                            <div key={i} className="flex gap-2">
                              <input placeholder="Title" value={l.title} onChange={(e) => { const links = [...wf.links]; links[i].title = e.target.value; setWf({ ...wf, links }); }} className="border-[3px] border-ink px-2 py-1 flex-1" />
                              <input placeholder="URL" value={l.url} onChange={(e) => { const links = [...wf.links]; links[i].url = e.target.value; setWf({ ...wf, links }); }} className="border-[3px] border-ink px-2 py-1 flex-1" />
                            </div>
                          ))}
                          <button type="button" onClick={() => setWf({ ...wf, links: [...wf.links, { title: "", url: "" }] })} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">+ Link</button>
                        </div>
                      </FormField>
                      <section className="border-[3px] border-ink p-[14px]">
                        <h3 className="text-[11px] font-bold uppercase">Topics</h3>
                        <div className="mt-[10px] grid grid-cols-2 gap-[8px] sm:grid-cols-3">
                          {TOPIC_TAGS.map((tag) => <label key={tag} className="flex items-center gap-[7px] text-[10px] font-bold uppercase"><input type="checkbox" checked={topicTags.includes(tag)} onChange={(event) => setTopicTags((current: string[]) => event.target.checked ? [...current, tag] : current.filter((item) => item !== tag))} />{tag}</label>)}
                        </div>
                        <h3 className="mt-[16px] text-[11px] font-bold uppercase">Products</h3>
                        <div className="mt-[10px] grid grid-cols-2 gap-[8px] sm:grid-cols-3">
                          {PRODUCT_TAGS.map((tag) => <label key={tag} className="flex items-center gap-[7px] text-[10px] font-bold uppercase"><input type="checkbox" checked={productTags.includes(tag)} onChange={(event) => setProductTags((current: string[]) => event.target.checked ? [...current, tag] : current.filter((item) => item !== tag))} />{tag}</label>)}
                        </div>
                      </section>
                      <FormField label="Rough notes / writeup body (Markdown)" id="wb" error={wfErrors.body}>
                        <textarea id="wb" value={wf.body} onChange={(e) => setWf({ ...wf, body: e.target.value })} className="border-[3px] border-ink px-3 py-2" rows={10} />
                      </FormField>
                      <section className="border-[3px] border-ink p-[14px]">
                        <h3 className="text-[12px] font-bold uppercase">Photos, slides &amp; links</h3>
                        {mediaList.length ? (
                          <div className="mt-[12px] grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                            {mediaList.map((media: any) => (
                              <label key={media.id} className="border-[2px] border-ink p-[7px]">
                                <img src={media.url} alt={media.altText || media.caption || "Uploaded event media"} className="aspect-[4/3] w-full object-cover" />
                                <span className="mt-[7px] flex items-start gap-[7px] text-[10px] font-bold uppercase leading-[1.4]">
                                  <input
                                    type="checkbox"
                                    checked={aiPhotoIds.includes(media.id)}
                                    onChange={(event) => setAiPhotoIds((current: string[]) => event.target.checked ? [...current, media.id] : current.filter((id: string) => id !== media.id))}
                                  />
                                  Send for AI caption
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-[8px] text-[12px] leading-[1.5]">Save a draft, then use the Media tab to upload event photos. Each photo stays opted out of AI processing unless you select it here.</p>
                        )}
                        <button type="button" onClick={() => setTab("Media")} className="mt-[12px] border-[3px] border-ink px-[12px] py-[8px] text-[11px] font-bold uppercase">Manage media ↗</button>
                      </section>
                      <label className="flex items-start gap-[10px] border-[3px] border-ink bg-yellow p-[12px] text-[12px] leading-[1.5]">
                        <input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} className="mt-[2px]" />
                        <span>I confirm I have permission to submit these notes and only the photos I select for AI processing. AI-generated content must be reviewed before publishing.</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => saveWriteup(false)} disabled={saving} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">{saving ? "Saving..." : "Save draft"}</button>
                        <button type="button" onClick={() => saveWriteup(true)} disabled={saving} className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white">{saving ? "Saving..." : "Publish"}</button>
                        <button type="button" disabled title="AI draft generation will be enabled when the approved AI service is deployed." className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white opacity-50">Generate draft · Coming soon</button>
                        <button type="button" onClick={() => setPreview((p: boolean) => !p)} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">Toggle preview</button>
                      </div>
                    </form>
                    {preview && (
                      <aside className="border-t-[3px] border-ink bg-[#fafafa] p-[18px] sm:p-[24px] lg:border-l-[3px] lg:border-t-0">
                        <div className="flex flex-wrap items-center justify-between gap-[8px]">
                          <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Draft preview</span>
                          <span className="text-[11px] font-bold uppercase">Editable in the form</span>
                        </div>
                        <h3 className="mt-[18px] font-display text-[34px] uppercase leading-[1]">{wf.title || "Your writeup title"}</h3>
                        <div className="mt-[16px] border-[3px] border-ink bg-white p-[18px] text-[13px] leading-[1.65]">
                          {wf.summary && <p className="mb-[16px]"><strong>Summary.</strong> {wf.summary}</p>}
                          {wf.body ? <ReactMarkdown>{wf.body}</ReactMarkdown> : <p className="text-[#666]">Your notes and writeup content will appear here as you draft.</p>}
                          {!wf.summary && !wf.body && <p className="mt-[14px]"><strong>Resources.</strong> Links you add will be included with your published writeup.</p>}
                        </div>
                        <div className="mt-[16px] border-[3px] border-ink bg-red p-[13px] text-[12px] font-bold leading-[1.5]">
                          Review names, numbers and links before publishing. You are responsible for the accuracy of your writeup.
                        </div>
                      </aside>
                    )}
                  </div>
                  <h3 className="font-display text-xl uppercase mt-6">My writeups</h3>
                  <div className="mt-2 grid gap-2">
                    {writeups.map((w: any) => (
                      <div key={w.id} className="border-[3px] border-ink p-3">
                        <div className="font-bold">{w.title} — {w.status}</div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => startEditWriteup(w)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Edit</button>
                          {w.status === "published" ? (
                            <button onClick={() => unpublish(w.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Unpublish</button>
                          ) : (
                            <button onClick={() => publishWriteup(w.id)} className="border-[3px] border-ink bg-ink px-3 py-1 text-sm font-bold uppercase text-white">Publish</button>
                          )}
                          {role === "admin" && <button onClick={() => deleteWriteup(w.id)} className="border-[3px] border-ink px-3 py-1 text-sm font-bold uppercase">Delete</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
  );
}

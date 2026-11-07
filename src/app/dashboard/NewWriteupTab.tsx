"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import FormField from "@/components/form/FormField";
import ReactMarkdown from "react-markdown";

const TOPIC_TAGS = ["cloud", "cybersecurity", "web", "mobile", "ai-ml", "data", "devops", "open-source", "careers"];
const PRODUCT_TAGS = ["android", "firebase", "flutter", "gemini", "chrome", "google-cloud"];

export default function NewWriteupTab({ editingWriteup, setEditingWriteup, wf, setWf, wfErrors, events, setMediaList, saveWriteup, saving, mediaList, aiPhotoIds, setAiPhotoIds, aiConsent, setAiConsent, setTab, writeupStep, setWriteupStep, topicTags, setTopicTags, productTags, setProductTags }: any) {
  function resetWriteup() {
    setEditingWriteup(null);
    setWf({ eventId: "", title: "", summary: "", body: "", attendance: "", links: [{ title: "", url: "" }] });
    setMediaList([]);
    setAiConsent(false);
    setAiPhotoIds([]);
    setTopicTags([]);
    setProductTags([]);
    setWriteupStep(1);
  }

  const toggleTag = (tag: string, selected: string[], setter: (next: string[]) => void) => {
    setter(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag]);
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <h2 className="font-display text-[clamp(42px,6vw,56px)] uppercase leading-none">{editingWriteup ? "Edit writeup" : "New writeup"}</h2>
        {editingWriteup && <button type="button" onClick={resetWriteup} className="border-[3px] border-ink px-[12px] py-[9px] text-[11px] font-bold uppercase">Start new writeup</button>}
      </div>

      <div className="mt-[20px] grid grid-cols-1 border-[3px] border-ink sm:grid-cols-3">
        <button type="button" onClick={() => setWriteupStep(1)} aria-current={writeupStep === 1 ? "step" : undefined} className={`border-b-[3px] border-ink px-[14px] py-[13px] text-left text-[11px] font-bold uppercase sm:border-b-0 sm:border-r-[3px] ${writeupStep === 1 ? "bg-ink text-white" : "bg-white"}`}>1&nbsp; Add your notes</button>
        <button type="button" onClick={() => setWriteupStep(2)} aria-current={writeupStep === 2 ? "step" : undefined} className={`border-b-[3px] border-ink px-[14px] py-[13px] text-left text-[11px] font-bold uppercase sm:border-b-0 sm:border-r-[3px] ${writeupStep === 2 ? "bg-yellow" : "bg-white"}`}>2&nbsp; AI draft</button>
        <button type="button" onClick={() => setWriteupStep(3)} aria-current={writeupStep === 3 ? "step" : undefined} className={`px-[14px] py-[13px] text-left text-[11px] font-bold uppercase ${writeupStep === 3 ? "bg-yellow" : "bg-white"}`}>3&nbsp; Review &amp; publish</button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); saveWriteup(false); }} className="mt-[20px] grid grid-cols-1 gap-0 border-[3px] border-ink lg:grid-cols-2">
        <div className="grid content-start gap-[14px] border-b-[3px] border-ink p-[18px] sm:p-[24px] lg:border-b-0 lg:border-r-[3px]">
          <FormField label="Event" id="we" error={wfErrors.eventId}>
            <select id="we" value={wf.eventId} onChange={(event) => setWf({ ...wf, eventId: event.target.value })} className="w-full border-[3px] border-ink px-3 py-2">
              <option value="">Select an event</option>
              {events.map((event: any) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
          </FormField>

          <FormField label="Rough notes" id="wb" error={wfErrors.body}>
            <textarea id="wb" value={wf.body} onChange={(event) => setWf({ ...wf, body: event.target.value })} className="min-h-[150px] w-full border-[3px] border-ink px-3 py-2" rows={8} placeholder="What happened? Topics covered, highlights, what went well, what to improve." />
          </FormField>

          <FormField label="Attendance" id="wa" error={wfErrors.attendance}>
            <input id="wa" type="number" min={0} value={wf.attendance} onChange={(event) => setWf({ ...wf, attendance: event.target.value })} className="w-full border-[3px] border-ink px-3 py-2" placeholder="e.g. 40" />
          </FormField>

          <FormField label="Links (optional)" id="wl" error={wfErrors.links}>
            <div className="grid gap-2">
              {wf.links.map((link: any, index: number) => (
                <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input aria-label={`Resource ${index + 1} title`} placeholder="Link title" value={link.title} onChange={(event) => { const links = [...wf.links]; links[index].title = event.target.value; setWf({ ...wf, links }); }} className="min-w-0 border-[3px] border-ink px-2 py-2" />
                  <input aria-label={`Resource ${index + 1} URL`} placeholder="URL" value={link.url} onChange={(event) => { const links = [...wf.links]; links[index].url = event.target.value; setWf({ ...wf, links }); }} className="min-w-0 border-[3px] border-ink px-2 py-2" />
                </div>
              ))}
              <button type="button" onClick={() => setWf({ ...wf, links: [...wf.links, { title: "", url: "" }] })} className="justify-self-start border-[3px] border-ink px-3 py-2 text-[11px] font-bold uppercase">+ Add link</button>
            </div>
          </FormField>
        </div>

        {writeupStep === 1 ? (
          <aside className="grid content-start gap-[14px] bg-[#fafafa] p-[18px] sm:p-[24px]">
            <div className="flex flex-wrap items-center justify-between gap-[8px]">
              <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Photos, slides &amp; links</span>
              <span className="text-[11px] font-bold uppercase">Choose what to include</span>
            </div>
            {mediaList.length ? (
              <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                {mediaList.map((media: any) => (
                  <label key={media.id} className="border-[2px] border-ink bg-white p-[7px]">
                    <img src={media.url} alt={media.altText || media.caption || "Uploaded event media"} className="aspect-[4/3] w-full object-cover" />
                    <span className="mt-[7px] flex items-start gap-[7px] text-[10px] font-bold uppercase leading-[1.4]">
                      <input type="checkbox" checked={aiPhotoIds.includes(media.id)} onChange={(event) => setAiPhotoIds((current: string[]) => event.target.checked ? [...current, media.id] : current.filter((id: string) => id !== media.id))} />
                      Send for AI caption
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="border-[3px] border-dashed border-ink bg-white p-[28px] text-center">
                <p className="text-[12px] font-bold uppercase">No event photos attached yet</p>
                <p className="mt-[8px] text-[11px] leading-[1.5]">Save a draft, then use the Media tab to upload event photos. Each photo stays opted out of AI processing unless you select it here.</p>
              </div>
            )}
            <button type="button" onClick={() => setTab("Media")} className="justify-self-start border-[3px] border-ink px-[12px] py-[8px] text-[11px] font-bold uppercase">Manage media ↗</button>
            <label className="flex items-start gap-[10px] border-[3px] border-ink bg-yellow p-[12px] text-[12px] leading-[1.5]">
              <input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} className="mt-[2px]" />
              <span>I confirm I have permission to submit these notes and only the photos I select for AI processing. AI-generated content must be reviewed before publishing.</span>
            </label>
            <button type="button" disabled title="AI draft generation will be enabled when the approved AI service is deployed." className="justify-self-start border-[3px] border-ink bg-ink px-[16px] py-[12px] text-[11px] font-bold uppercase text-white opacity-50">Generate draft · Coming soon</button>
          </aside>
        ) : (
          <aside className="grid content-start gap-[14px] bg-[#fafafa] p-[18px] sm:p-[24px]">
            <div className="flex flex-wrap items-center justify-between gap-[8px]">
              <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Draft preview</span>
              <span className="text-[11px] font-bold uppercase">Editable</span>
            </div>

            <label htmlFor="wt" className="sr-only">Writeup title</label>
            <input id="wt" value={wf.title} onChange={(event) => setWf({ ...wf, title: event.target.value })} className="w-full border-[3px] border-ink bg-white px-[12px] py-[10px] font-display text-[30px] uppercase leading-none" placeholder="Your writeup title" />
            {wfErrors.title && <p className="text-[11px] font-bold text-red">{wfErrors.title}</p>}

            <label htmlFor="ws" className="sr-only">Writeup summary</label>
            <textarea id="ws" value={wf.summary} onChange={(event) => setWf({ ...wf, summary: event.target.value })} className="w-full border-[3px] border-ink bg-yellow px-[12px] py-[12px] text-[12px] leading-[1.5]" rows={2} placeholder="Summary (max 40 words)" />
            <p className="text-right text-[10px] font-bold uppercase">{wf.summary.trim() ? wf.summary.trim().split(/\s+/).length : 0}/40 words</p>
            {wfErrors.summary && <p className="text-[11px] font-bold text-red">{wfErrors.summary}</p>}

            <div className="border-[3px] border-ink bg-white p-[16px] text-[13px] leading-[1.65]">
              <h3 className="mb-[10px] font-bold uppercase">What we covered</h3>
              {wf.body ? <ReactMarkdown>{wf.body}</ReactMarkdown> : <p className="text-[#666]">Your notes and writeup content will appear here as you draft.</p>}
              <h3 className="mt-[18px] font-bold uppercase">Resources</h3>
              {wf.links.filter((link: any) => link.title || link.url).length ? (
                <ul className="mt-[6px] list-disc pl-[18px]">
                  {wf.links.filter((link: any) => link.title || link.url).map((link: any, index: number) => <li key={index}>{link.title || link.url}</li>)}
                </ul>
              ) : <p className="mt-[6px] text-[#666]">Links you add will be included with your published writeup.</p>}
            </div>

            <section className="border-[3px] border-ink bg-white p-[12px]">
              <h3 className="text-[11px] font-bold uppercase">Auto tags</h3>
              <div className="mt-[8px] flex flex-wrap gap-[6px]">
                {TOPIC_TAGS.map((tag) => <button key={tag} type="button" aria-pressed={topicTags.includes(tag)} onClick={() => toggleTag(tag, topicTags, setTopicTags)} className={`border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase ${topicTags.includes(tag) ? "bg-yellow" : "bg-white"}`}>{tag}</button>)}
                {PRODUCT_TAGS.map((tag) => <button key={tag} type="button" aria-pressed={productTags.includes(tag)} onClick={() => toggleTag(tag, productTags, setProductTags)} className={`border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase ${productTags.includes(tag) ? "bg-yellow" : "bg-white"}`}>{tag}</button>)}
              </div>
            </section>

            <div className="border-[3px] border-ink bg-red p-[13px] text-[12px] font-bold leading-[1.5]">
              Review names, numbers and quotes before publishing. You are responsible for the accuracy of your writeup.
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => saveWriteup(true)} disabled={saving} className="border-[3px] border-ink bg-yellow px-4 py-2 font-bold uppercase">{saving ? "Saving..." : "Publish"}</button>
              <button type="button" onClick={() => saveWriteup(false)} disabled={saving} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">{saving ? "Saving..." : "Save draft"}</button>
              <button type="button" disabled title="AI regeneration will be enabled when the approved AI service is deployed." className="border-[3px] border-ink px-4 py-2 font-bold uppercase opacity-50">Regenerate · Coming soon</button>
            </div>
          </aside>
        )}
      </form>
    </section>
  );
}

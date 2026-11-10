"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import FormField from "@/components/form/FormField";
import ReactMarkdown from "react-markdown";

const TOPIC_TAGS = ["cloud", "cybersecurity", "web", "mobile", "ai-ml", "data", "devops", "open-source", "careers"];
const PRODUCT_TAGS = ["android", "firebase", "flutter", "gemini", "chrome", "google-cloud"];

export default function NewWriteupTab({ editingWriteup, wf, setWf, wfErrors, events, saveWriteup, saving, mediaList, aiPhotoIds, setAiPhotoIds, aiConsent, setAiConsent, setTab, writeupStep, setWriteupStep, topicTags, setTopicTags, productTags, setProductTags, generateDraft, aiGenerating, generateAiCaptions, aiCaptioning, aiCaptionSuggestions, applyAiCaption, aiDrafted }: any) {
  const toggleTag = (tag: string, selected: string[], setter: (next: string[]) => void) => {
    setter(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag]);
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <h2 className="font-display text-[clamp(42px,6vw,56px)] uppercase leading-none">{editingWriteup ? "Edit writeup" : "New writeup"}</h2>
      </div>

      <div data-testid="writeup-stepper" className="mt-[20px] grid grid-cols-3 border-[3px] border-ink">
        <button type="button" onClick={() => setWriteupStep(1)} aria-current={writeupStep === 1 ? "step" : undefined} className={`min-w-0 border-r-[3px] border-ink px-[6px] py-[10px] text-left text-[9px] font-bold uppercase leading-[1.3] break-words sm:px-[14px] sm:py-[13px] sm:text-[11px] ${writeupStep === 1 ? "bg-ink text-white" : "bg-white"}`}>1&nbsp; Add your notes</button>
        <button type="button" onClick={() => setWriteupStep(2)} aria-current={writeupStep === 2 ? "step" : undefined} className={`min-w-0 border-r-[3px] border-ink px-[6px] py-[10px] text-left text-[9px] font-bold uppercase leading-[1.3] break-words sm:px-[14px] sm:py-[13px] sm:text-[11px] ${writeupStep === 2 ? "bg-yellow" : "bg-white"}`}>2&nbsp; AI draft</button>
        <button type="button" onClick={() => setWriteupStep(3)} aria-current={writeupStep === 3 ? "step" : undefined} className={`min-w-0 px-[6px] py-[10px] text-left text-[9px] font-bold uppercase leading-[1.3] break-words sm:px-[14px] sm:py-[13px] sm:text-[11px] ${writeupStep === 3 ? "bg-yellow" : "bg-white"}`}>3&nbsp; Review &amp; publish</button>
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
            <textarea id="wb" value={wf.body} onChange={(event) => setWf({ ...wf, body: event.target.value })} className="min-h-[150px] w-full border-[3px] border-ink px-3 py-2" rows={8} placeholder="Your notes go here. The AI only uses what you write." />
          </FormField>

          <div className="grid grid-cols-2 gap-[8px] sm:gap-[14px]">
            <FormField label="Attendance" id="wa" error={wfErrors.attendance}>
              <input id="wa" type="number" min={0} value={wf.attendance} onChange={(event) => setWf({ ...wf, attendance: event.target.value })} className="w-full border-[3px] border-ink px-3 py-2" placeholder="000" />
            </FormField>

            {writeupStep === 1 && (
              <FormField label="Link (optional)" id="wl" error={wfErrors.links}>
                <input id="wl" aria-label="Resource link URL" placeholder="https://" value={wf.links[0]?.url || ""} onChange={(event) => { const links = [...wf.links]; links[0] = { ...links[0], url: event.target.value, title: links[0]?.title || event.target.value }; setWf({ ...wf, links }); }} className="w-full border-[3px] border-ink px-2 py-2" />
              </FormField>
            )}
          </div>
          {writeupStep !== 1 && (
            <>
              <div className="border-[3px] border-dashed border-ink bg-white p-[20px] text-center">
                <p className="text-[12px] font-bold uppercase">Photos, slides &amp; links</p>
                <button type="button" onClick={() => setTab("Media")} className="mt-[7px] border-[3px] border-ink px-[14px] py-[12px] text-[11px] font-bold uppercase">Drop files here or browse ↗</button>
              </div>
              <button type="button" onClick={generateAiCaptions} disabled={!editingWriteup?.id || !aiConsent || aiPhotoIds.length === 0 || aiCaptioning} className="justify-self-start border-[3px] border-ink bg-yellow px-[16px] py-[12px] text-[11px] font-bold uppercase disabled:opacity-50">{aiCaptioning ? "Generating captions…" : "Generate selected photo captions"}</button>
            {!editingWriteup?.id && <p className="text-[10px] leading-[1.5]">Save the writeup as a draft before generating captions.</p>}
            {aiCaptionSuggestions.length > 0 && (
              <div className="grid gap-[10px] border-[3px] border-ink bg-white p-[12px]">
                <h3 className="text-[11px] font-bold uppercase">AI caption suggestions · Review before applying</h3>
                {aiCaptionSuggestions.map((suggestion: any) => (
                  <div key={suggestion.mediaId} className="border-t-[2px] border-ink pt-[10px]">
                    <p className="text-[11px] font-bold uppercase">Caption</p>
                    <p className="mt-[3px] text-[12px] leading-[1.5]">{suggestion.caption}</p>
                    <p className="mt-[8px] text-[11px] font-bold uppercase">Alt text</p>
                    <p className="mt-[3px] text-[12px] leading-[1.5]">{suggestion.altText}</p>
                    <button type="button" onClick={() => applyAiCaption(suggestion)} className="mt-[8px] border-[2px] border-ink bg-yellow px-[10px] py-[7px] text-[10px] font-bold uppercase">Apply caption and alt text</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={generateDraft} disabled={aiGenerating} className="justify-self-start border-[3px] border-ink bg-ink px-[16px] py-[12px] text-[11px] font-bold uppercase text-white disabled:opacity-50">{aiGenerating ? "Generating with Gemini…" : "Generate draft with Gemini"}</button>
            </>
          )}
        </div>

        {writeupStep === 1 ? (
          <aside className="grid content-start gap-[14px] bg-[#fafafa] p-[18px] sm:p-[24px]">
            <div className="flex flex-wrap items-center justify-between gap-[8px]">
              <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Photos</span>
            </div>
            <p className="text-[11px] leading-[1.5]">Tick the photos you want AI to caption. Unticked photos stay private and receive no AI caption.</p>
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
                <button type="button" onClick={() => setTab("Media")} className="flex aspect-[4/3] flex-col items-center justify-center border-[3px] border-dashed border-ink bg-white p-[10px] text-[11px] font-bold uppercase">+ Add photos</button>
              </div>
            ) : (
              <div className="border-[3px] border-dashed border-ink bg-white p-[28px] text-center">
                <p className="text-[12px] font-bold uppercase">No event photos attached yet</p>
                <p className="mt-[8px] text-[11px] leading-[1.5]">Save a draft, then use the Media tab to upload event photos. Each photo stays opted out of AI processing unless you select it here.</p>
                <button type="button" onClick={() => setTab("Media")} className="mt-[14px] border-[3px] border-ink px-[12px] py-[8px] text-[11px] font-bold uppercase">+ Add photos</button>
              </div>
            )}
            <div className="border-[3px] border-ink bg-yellow p-[12px] text-[11px] font-bold leading-[1.5]">Only select photos of people who have agreed to their images being used for AI captioning.</div>
            <label className="flex items-start gap-[10px] border-[3px] border-ink bg-white p-[12px] text-[12px] leading-[1.5]">
              <input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} className="mt-[2px]" />
              <span>I confirm the people in the ticked photos have agreed.</span>
            </label>
            <button type="button" onClick={generateDraft} disabled={aiGenerating} className="justify-self-start border-[3px] border-ink bg-ink px-[16px] py-[12px] text-[11px] font-bold uppercase text-white disabled:opacity-50">{aiGenerating ? "Generating with Gemini…" : "Generate draft with Gemini"}</button>
          </aside>
        ) : (
          <aside className="grid content-start gap-[14px] bg-[#fafafa] p-[18px] sm:p-[24px]">
            <div className="flex flex-wrap items-center justify-between gap-[8px]">
              <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Draft preview</span>
              <span className="text-[11px] font-bold uppercase">Editable</span>{aiDrafted && <span className="border-[2px] border-ink bg-yellow px-[8px] py-[4px] text-[9px] font-bold uppercase">AI-assisted · review required</span>}
            </div>

            <label htmlFor="wt" className="sr-only">Writeup title</label>
            <input id="wt" value={wf.title} onChange={(event) => setWf({ ...wf, title: event.target.value })} className="w-full border-0 bg-transparent px-0 py-[6px] font-display text-[30px] uppercase leading-none focus:outline-none focus:ring-2 focus:ring-blue" placeholder="Your writeup title" />
            {wfErrors.title && <p className="text-[11px] font-bold text-red">{wfErrors.title}</p>}

            <label htmlFor="ws" className="sr-only">Writeup summary</label>
            <textarea id="ws" value={wf.summary} onChange={(event) => setWf({ ...wf, summary: event.target.value })} className="w-full border-[3px] border-ink bg-yellow px-[12px] py-[12px] text-[12px] leading-[1.5]" rows={2} placeholder="Summary (max 40 words)" />
            <p className="text-right text-[10px] font-bold uppercase">{wf.summary.trim() ? wf.summary.trim().split(/\s+/).length : 0}/40 words</p>
            {wfErrors.summary && <p className="text-[11px] font-bold text-red">{wfErrors.summary}</p>}

            <div className="border-[3px] border-ink bg-white p-[16px] text-[13px] leading-[1.65]">
              <h3 className="mb-[10px] font-bold uppercase">What we covered</h3>
              {wf.body ? (
                <ReactMarkdown components={{
                  h2: ({ children }) => <h4 className="mt-[14px] font-bold uppercase">{children}</h4>,
                  p: ({ children }) => <p className="mt-[6px]">{children}</p>,
                  ul: ({ children }) => <ul className="mt-[6px] list-disc pl-[18px]">{children}</ul>,
                  li: ({ children }) => <li className="mt-[3px]">{children}</li>,
                }}>{wf.body}</ReactMarkdown>
              ) : <p className="text-[#666]">Your notes and writeup content will appear here as you draft.</p>}
              <h3 className="mt-[18px] font-bold uppercase">Resources</h3>
              {wf.links.filter((link: any) => link.title || link.url).length ? (
                <ul className="mt-[6px] list-disc pl-[18px]">
                  {wf.links.filter((link: any) => link.title || link.url).map((link: any, index: number) => <li key={index}>{link.title || link.url}</li>)}
                </ul>
              ) : <p className="mt-[6px] text-[#666]">Links you add will be included with your published writeup.</p>}
            </div>

            <section className="border-[3px] border-ink bg-white p-[12px]">
              <h3 className="text-[11px] font-bold uppercase">Auto tags</h3>
              <div className="mt-[8px] flex flex-wrap items-center gap-[6px]">
                {[...topicTags, ...productTags].map((tag) => <span key={tag} className="border-[2px] border-ink bg-yellow px-[8px] py-[5px] text-[9px] font-bold uppercase">{tag}</span>)}
                <details>
                  <summary className="cursor-pointer border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase">+ Add tag</summary>
                  <div className="mt-[8px] flex flex-wrap gap-[6px] border-t-[2px] border-ink pt-[8px]">
                    {TOPIC_TAGS.map((tag) => <button key={tag} type="button" aria-pressed={topicTags.includes(tag)} onClick={() => toggleTag(tag, topicTags, setTopicTags)} className={`border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase ${topicTags.includes(tag) ? "bg-yellow" : "bg-white"}`}>{tag}</button>)}
                    {PRODUCT_TAGS.map((tag) => <button key={tag} type="button" aria-pressed={productTags.includes(tag)} onClick={() => toggleTag(tag, productTags, setProductTags)} className={`border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase ${productTags.includes(tag) ? "bg-yellow" : "bg-white"}`}>{tag}</button>)}
                  </div>
                </details>
              </div>
            </section>

            <div className="border-[3px] border-ink bg-red p-[13px] text-[12px] font-bold leading-[1.5]">
              Review names, numbers and quotes before publishing. You are responsible for the accuracy of your writeup.
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => saveWriteup(true)} disabled={saving} className="border-[3px] border-ink bg-yellow px-4 py-2 font-bold uppercase">{saving ? "Saving..." : "Publish"}</button>
              <button type="button" onClick={() => saveWriteup(false)} disabled={saving} className="border-[3px] border-ink px-4 py-2 font-bold uppercase">{saving ? "Saving..." : "Save draft"}</button>
              <button type="button" onClick={generateDraft} disabled={aiGenerating} className="border-[3px] border-ink px-4 py-2 font-bold uppercase disabled:opacity-50">{aiGenerating ? "Regenerating…" : "Regenerate with Gemini"}</button>
            </div>
          </aside>
        )}
      </form>
    </section>
  );
}

"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import FormField from "@/components/form/FormField";
import ReactMarkdown from "react-markdown";

const TOPIC_TAGS = ["cloud", "cybersecurity", "web", "mobile", "ai-ml", "data", "devops", "open-source", "careers"];
const PRODUCT_TAGS = ["android", "firebase", "flutter", "gemini", "chrome", "google-cloud"];

export default function NewWriteupTab({
  wf, setWf, wfErrors, events, saveWriteup, saving, mediaList, aiPhotoIds, setAiPhotoIds,
  aiConsent, setAiConsent, setTab, writeupStep, setWriteupStep, topicTags, setTopicTags,
  productTags, setProductTags, aiDrafted, setAiDrafted, aiReviewed, setAiReviewed,
  publicationConfirmed, setPublicationConfirmed, isPublished, generateDraft, generatingDraft,
  generatePhotoCaptions, captioningPhotos, aiConfigured, aiActionError, hasSavedWriteup,
}: any) {
  const toggleTag = (tag: string, selected: string[], setter: (next: string[]) => void) => {
    setter(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag]);
  };

  const updateField = (field: string, value: string) => {
    setWf({ ...wf, [field]: value });
    if (aiDrafted) setAiReviewed(false);
    setPublicationConfirmed(false);
  };

  const updateLink = (index: number, field: "title" | "url", value: string) => {
    const links = [...wf.links];
    links[index] = { ...links[index], [field]: value };
    setWf({ ...wf, links });
    if (aiDrafted) setAiReviewed(false);
    setPublicationConfirmed(false);
  };

  const stepLabels = ["Add your notes", "AI draft", "Review & publish"];
  const saveLabel = isPublished ? "Save changes" : "Save draft";

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div>
          <h2 className="font-display text-[clamp(42px,6vw,56px)] uppercase leading-none">
            {hasSavedWriteup ? "Edit writeup" : "New writeup"}
          </h2>
          <p className="mt-[8px] text-[12px] leading-[1.5]">
            Save a draft at any point. Publishing is a separate, deliberate step.
          </p>
        </div>
        {hasSavedWriteup && (
          <button type="button" onClick={() => setTab("Media")} className="border-[3px] border-ink px-[12px] py-[10px] text-[10px] font-bold uppercase">
            Manage media ({mediaList.length})
          </button>
        )}
      </div>

      <div data-testid="writeup-stepper" className="mt-[20px] grid grid-cols-3 border-[3px] border-ink">
        {stepLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setWriteupStep(index + 1)}
            aria-current={writeupStep === index + 1 ? "step" : undefined}
            className={`min-w-0 ${index < 2 ? "border-r-[3px] border-ink" : ""} px-[6px] py-[10px] text-left text-[9px] font-bold uppercase leading-[1.3] break-words sm:px-[14px] sm:py-[13px] sm:text-[11px] ${writeupStep === index + 1 ? (index === 0 ? "bg-ink text-white" : "bg-yellow") : "bg-white"}`}
          >
            {index + 1}&nbsp; {label}
          </button>
        ))}
      </div>

      <form onSubmit={(event) => event.preventDefault()} className="mt-[20px] grid grid-cols-1 gap-0 border-[3px] border-ink lg:grid-cols-2">
        <div className="grid content-start gap-[14px] border-b-[3px] border-ink p-[18px] sm:p-[24px] lg:border-b-0 lg:border-r-[3px]">
          <FormField label="Event" id="we" error={wfErrors.eventId}>
            <select id="we" value={wf.eventId} onChange={(event) => updateField("eventId", event.target.value)} className="w-full border-[3px] border-ink px-3 py-2">
              <option value="">Select an event</option>
              {events.filter((event: any) => event.trackId !== "chapter").map((event: any) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
          </FormField>

          <FormField label="Session notes / source material" id="wb" error={wfErrors.notes}>
            <textarea
              id="wb"
              value={wf.notes ?? wf.body}
              onChange={(event) => {
                setWf({ ...wf, notes: event.target.value });
                if (aiDrafted) setAiReviewed(false);
                setPublicationConfirmed(false);
              }}
              className="min-h-[170px] w-full border-[3px] border-ink px-3 py-2"
              rows={8}
              placeholder="What actually happened? Add topics covered, demonstrations, commands, questions, decisions and verified takeaways. Avoid guesses."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-[8px] sm:gap-[14px]">
            <FormField label="Attendance (optional)" id="wa" error={wfErrors.attendance}>
              <input id="wa" type="number" min={0} value={wf.attendance} onChange={(event) => updateField("attendance", event.target.value)} className="w-full border-[3px] border-ink px-3 py-2" placeholder="Leave blank if unknown" />
            </FormField>
            <div className="self-end text-[11px] leading-[1.5] text-[#555]">
              Do not use RSVP counts as attendance. Leave this blank if the actual figure is unknown.
            </div>
          </div>

          <section className="border-[3px] border-ink bg-white p-[12px]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[11px] font-bold uppercase">Resources & links</h3>
              <button type="button" onClick={() => setWf({ ...wf, links: [...wf.links, { title: "", url: "" }] })} className="border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase">+ Add link</button>
            </div>
            <div className="mt-[10px] grid gap-[10px]">
              {wf.links.map((link: any, index: number) => (
                <div key={index} className="grid gap-[6px] border-t-[2px] border-ink pt-[10px]">
                  <label htmlFor={`writeup-link-title-${index}`} className="text-[9px] font-bold uppercase">Link title</label>
                  <input id={`writeup-link-title-${index}`} value={link.title} onChange={(event) => updateLink(index, "title", event.target.value)} className="w-full border-[2px] border-ink px-[8px] py-[7px] text-[12px]" placeholder="Cloud Track curriculum" />
                  <label htmlFor={`writeup-link-url-${index}`} className="text-[9px] font-bold uppercase">URL</label>
                  <div className="flex gap-[6px]">
                    <input id={`writeup-link-url-${index}`} value={link.url} onChange={(event) => updateLink(index, "url", event.target.value)} className="min-w-0 flex-1 border-[2px] border-ink px-[8px] py-[7px] text-[12px]" placeholder="https://" />
                    <button type="button" aria-label={`Remove link ${index + 1}`} onClick={() => setWf({ ...wf, links: wf.links.length > 1 ? wf.links.filter((_: any, i: number) => i !== index) : [{ title: "", url: "" }] })} className="border-[2px] border-ink px-[8px] text-[10px] font-bold uppercase">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            {wfErrors.links && <p className="mt-[6px] text-[11px] font-bold text-red">{wfErrors.links}</p>}
          </section>

          {writeupStep === 1 && (
            <button type="button" onClick={() => setWriteupStep(2)} className="justify-self-start border-[3px] border-ink bg-yellow px-[16px] py-[12px] text-[11px] font-bold uppercase">
              Continue to AI draft ↗
            </button>
          )}

          {writeupStep === 2 && (
            <div className="grid gap-[10px]">
              <div className="border-[3px] border-ink bg-yellow p-[12px] text-[11px] leading-[1.5]">
                AI uses your notes as its factual source. It must not invent activities, attendance, questions or participant outcomes. You remain responsible for checking every claim.
              </div>
              {!aiConfigured && (
                <p role="status" className="border-[3px] border-ink bg-[#f5f5f5] p-[12px] text-[11px] leading-[1.5]">
                  AI features are not configured yet. Set up Firebase AI Logic and App Check, then add the public reCAPTCHA Enterprise site key to the build environment. You can still write and save manually.
                </p>
              )}
              {aiActionError && <p role="alert" className="border-[3px] border-ink bg-red p-[12px] text-[11px] font-bold leading-[1.5]">{aiActionError}</p>}
              <button type="button" onClick={() => void generateDraft()} disabled={!aiConfigured || generatingDraft || !wf.eventId || (wf.notes ?? wf.body).trim().length < 40} className="justify-self-start border-[3px] border-ink bg-ink px-[16px] py-[12px] text-[11px] font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-40">
                {generatingDraft ? "Generating draft…" : aiDrafted ? "Regenerate draft" : "Generate AI draft"}
              </button>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void saveWriteup(false)} disabled={saving} className="border-[3px] border-ink px-[14px] py-[10px] text-[10px] font-bold uppercase disabled:opacity-50">{saving ? "Saving…" : saveLabel}</button>
                <button type="button" onClick={() => setWriteupStep(3)} className="border-[3px] border-ink bg-yellow px-[14px] py-[10px] text-[10px] font-bold uppercase">
                  Continue to review ↗
                </button>
              </div>
            </div>
          )}

          {writeupStep === 3 && (
            <div className="grid gap-[10px]">
              <button type="button" onClick={() => setWriteupStep(2)} className="justify-self-start border-[3px] border-ink px-[12px] py-[9px] text-[10px] font-bold uppercase">← Back to draft</button>
              <p className="text-[11px] leading-[1.5]">Review the article, event association, links, tags and media before publishing. You can save a draft without publishing it.</p>
              {wfErrors.title && <p role="alert" className="text-[11px] font-bold text-red">Title: {wfErrors.title}</p>}
              {wfErrors.summary && <p role="alert" className="text-[11px] font-bold text-red">Summary: {wfErrors.summary}</p>}
              {wfErrors.body && <p role="alert" className="text-[11px] font-bold text-red">Article body: {wfErrors.body}</p>}
              {wfErrors.links && <p role="alert" className="text-[11px] font-bold text-red">Links: {wfErrors.links}</p>}
              {wfErrors.review && <p role="alert" className="text-[11px] font-bold text-red">{wfErrors.review}</p>}
              {wfErrors.aiReviewed && <p role="alert" className="text-[11px] font-bold text-red">{wfErrors.aiReviewed}</p>}
              <label className="flex items-start gap-[9px] border-[3px] border-ink bg-white p-[12px] text-[11px] leading-[1.5]">
                <input type="checkbox" checked={aiDrafted} disabled={aiDrafted} onChange={() => { setAiDrafted(true); setAiReviewed(false); setPublicationConfirmed(false); }} className="mt-[2px] disabled:opacity-70" />
                <span>This writeup text or its attached photo captions were created or substantially assisted by AI. Once recorded, this disclosure cannot be removed.</span>
              </label>
              {aiDrafted && (
                <label className="flex items-start gap-[9px] border-[3px] border-ink bg-yellow p-[12px] text-[11px] leading-[1.5]">
                  <input type="checkbox" checked={aiReviewed} onChange={(event) => { setAiReviewed(event.target.checked); setPublicationConfirmed(false); }} className="mt-[2px]" />
                  <span>I have reviewed all AI-assisted article text and photo captions, corrected inaccuracies and confirmed that nothing invents session details.</span>
                </label>
              )}
              <label className="flex items-start gap-[9px] border-[3px] border-ink bg-white p-[12px] text-[11px] leading-[1.5]">
                <input type="checkbox" checked={publicationConfirmed} onChange={(event) => setPublicationConfirmed(event.target.checked)} className="mt-[2px]" />
                <span>I have checked the article&apos;s facts, names, numbers, links, photo captions, alt text and permissions for attached photos. I am ready to publish this version.</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void saveWriteup(false)} disabled={saving} className="border-[3px] border-ink px-4 py-2 text-[11px] font-bold uppercase disabled:opacity-50">{saving ? "Saving…" : saveLabel}</button>
                <button type="button" onClick={() => void saveWriteup(true)} disabled={saving || !publicationConfirmed || (aiDrafted && !aiReviewed)} className="border-[3px] border-ink bg-yellow px-4 py-2 text-[11px] font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Publishing…" : "Publish writeup ↗"}</button>
              </div>
            </div>
          )}
        </div>

        <aside className="grid content-start gap-[14px] bg-[#fafafa] p-[18px] sm:p-[24px]">
          {writeupStep === 1 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-[8px]">
                <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Photos</span>
                <span className="text-[10px] font-bold uppercase">{mediaList.length} attached</span>
              </div>
              <p className="text-[11px] leading-[1.5]">Save the writeup as a draft before uploading photos. Only select photos for AI captioning when everyone pictured has agreed to that use.</p>
              {mediaList.length ? (
                <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
                  {mediaList.map((media: any) => (
                    <label key={media.id} className="border-[2px] border-ink bg-white p-[7px]">
                      <img src={media.url} alt={media.altText || media.caption || "Uploaded event media"} className="aspect-[4/3] w-full object-cover" />
                      <span className="mt-[7px] flex items-start gap-[7px] text-[10px] font-bold uppercase leading-[1.4]">
                        <input type="checkbox" checked={aiPhotoIds.includes(media.id)} disabled={isPublished} onChange={(event) => setAiPhotoIds((current: string[]) => event.target.checked ? [...current, media.id] : current.filter((id: string) => id !== media.id))} />
                        Send for AI caption (max 5 per batch)
                      </span>
                      {media.caption && <span className="mt-[5px] block text-[9px] leading-[1.4]">{media.caption}</span>}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="border-[3px] border-dashed border-ink bg-white p-[24px] text-center">
                  <p className="text-[12px] font-bold uppercase">No event photos attached yet</p>
                  <p className="mt-[8px] text-[11px] leading-[1.5]">Save this writeup as a draft, then open the Media tab to upload photos.</p>
                  {hasSavedWriteup && <button type="button" onClick={() => setTab("Media")} className="mt-[12px] border-[3px] border-ink px-[12px] py-[8px] text-[10px] font-bold uppercase">Open media ↗</button>}
                </div>
              )}
              {isPublished && mediaList.length > 0 && <p role="status" className="border-[3px] border-ink bg-yellow p-[10px] text-[11px] font-bold">Unpublish this writeup before changing or generating photo captions.</p>}
              {mediaList.length > 0 && (
                <>
                  <label className="flex items-start gap-[9px] border-[3px] border-ink bg-white p-[12px] text-[11px] leading-[1.5]">
                    <input type="checkbox" checked={aiConsent} onChange={(event) => { setAiConsent(event.target.checked); if (!event.target.checked) setAiPhotoIds([]); }} className="mt-[2px]" />
                    <span>I confirm that everyone identifiable in the selected photos has agreed to AI processing for captioning.</span>
                  </label>
                  <button type="button" onClick={() => void generatePhotoCaptions()} disabled={!aiConfigured || !aiConsent || aiPhotoIds.length === 0 || captioningPhotos || isPublished} className="justify-self-start border-[3px] border-ink bg-ink px-[14px] py-[10px] text-[10px] font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-40">
                    {captioningPhotos ? "Generating captions…" : "Generate selected captions"}
                  </button>
                  {aiActionError && <p role="alert" className="text-[11px] font-bold text-red">{aiActionError}</p>}
                </>
              )}
              <button type="button" onClick={() => setTab("Media")} disabled={!hasSavedWriteup} className="justify-self-start border-[3px] border-ink px-[12px] py-[9px] text-[10px] font-bold uppercase disabled:opacity-40">Manage photos & alt text ↗</button>
            </>
          )}

          {writeupStep === 2 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-[8px]">
                <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Editable draft</span>
                <span className="text-[10px] font-bold uppercase">{aiDrafted ? "AI-assisted" : "Manual draft"}</span>
              </div>
              <FormField label="Writeup title" id="wt" error={wfErrors.title}>
                <input id="wt" value={wf.title} onChange={(event) => updateField("title", event.target.value)} className="w-full border-[3px] border-ink px-3 py-2" placeholder="Your writeup title" />
              </FormField>
              <FormField label="Summary (max 40 words)" id="ws" error={wfErrors.summary}>
                <textarea id="ws" value={wf.summary} onChange={(event) => updateField("summary", event.target.value)} className="w-full border-[3px] border-ink bg-yellow px-[12px] py-[10px] text-[12px] leading-[1.5]" rows={3} placeholder="A concise summary for the public writeup listing." />
                <p className="mt-[4px] text-right text-[10px] font-bold uppercase">{wf.summary.trim() ? wf.summary.trim().split(/\s+/).filter(Boolean).length : 0}/40 words</p>
              </FormField>
              <FormField label="Article body (Markdown)" id="body-editor" error={wfErrors.body}>
                <textarea id="body-editor" value={wf.body} onChange={(event) => updateField("body", event.target.value)} className="min-h-[300px] w-full border-[3px] border-ink bg-white px-3 py-2 font-mono text-[12px] leading-[1.6]" rows={16} placeholder="Write or edit the article in Markdown…" />
              </FormField>
              <section className="border-[3px] border-ink bg-white p-[12px]">
                <h3 className="text-[10px] font-bold uppercase">Preview</h3>
                <div className="mt-[8px] max-h-[420px] overflow-y-auto text-[12px] leading-[1.6]">
                  {wf.body ? <ReactMarkdown>{wf.body}</ReactMarkdown> : <p className="text-[#666]">Your article preview will appear here.</p>}
                </div>
              </section>
              <section className="border-[3px] border-ink bg-white p-[12px]">
                <h3 className="text-[11px] font-bold uppercase">Tags</h3>
                <div className="mt-[8px] flex flex-wrap items-center gap-[6px]">
                  {[...topicTags, ...productTags].map((tag) => <span key={tag} className="border-[2px] border-ink bg-yellow px-[8px] py-[5px] text-[9px] font-bold uppercase">{tag}</span>)}
                  <details>
                    <summary className="cursor-pointer border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase">Edit tags</summary>
                    <div className="mt-[8px] flex flex-wrap gap-[6px] border-t-[2px] border-ink pt-[8px]">
                      {TOPIC_TAGS.map((tag) => <button key={tag} type="button" aria-pressed={topicTags.includes(tag)} onClick={() => toggleTag(tag, topicTags, setTopicTags)} className={`border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase ${topicTags.includes(tag) ? "bg-yellow" : "bg-white"}`}>{tag}</button>)}
                      {PRODUCT_TAGS.map((tag) => <button key={tag} type="button" aria-pressed={productTags.includes(tag)} onClick={() => toggleTag(tag, productTags, setProductTags)} className={`border-[2px] border-ink px-[8px] py-[5px] text-[9px] font-bold uppercase ${productTags.includes(tag) ? "bg-yellow" : "bg-white"}`}>{tag}</button>)}
                    </div>
                  </details>
                </div>
              </section>
            </>
          )}

          {writeupStep === 3 && (
            <>
              <span className="bg-ink px-[10px] py-[5px] text-[10px] font-bold uppercase text-white">Final review preview</span>
              <h3 className="font-display text-[30px] uppercase leading-[1.1]">{wf.title || "Untitled writeup"}</h3>
              <p className="border-[3px] border-ink bg-yellow p-[12px] text-[12px] leading-[1.5]">{wf.summary || "No summary added yet."}</p>
              <div className="max-h-[620px] overflow-y-auto border-[3px] border-ink bg-white p-[14px] text-[12px] leading-[1.65]">
                {wf.body ? <ReactMarkdown>{wf.body}</ReactMarkdown> : <p className="text-[#666]">The article body is empty. Go back to the AI draft step to write it.</p>}
              </div>
              <div className="border-[3px] border-ink bg-white p-[12px]">
                <h3 className="text-[10px] font-bold uppercase">Resources</h3>
                {wf.links.filter((link: any) => link.url).length ? (
                  <ul className="mt-[6px] list-disc pl-[18px] text-[11px]">
                    {wf.links.filter((link: any) => link.url).map((link: any, index: number) => <li key={index}>{link.title || link.url} — {link.url}</li>)}
                  </ul>
                ) : <p className="mt-[6px] text-[11px] text-[#666]">No links attached.</p>}
              </div>
              <p className="text-[11px] leading-[1.5]">Review the full article in the editor and inspect every attached photo caption and alt text in the Media tab before publishing.</p>
            </>
          )}
        </aside>
      </form>
    </section>
  );
}

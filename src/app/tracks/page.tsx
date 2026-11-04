"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { TRACKS } from "@/lib/tracks";

export default function TracksPage() {
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <h1 className="font-display text-4xl uppercase">Tracks</h1>
        <div className="mt-6 grid gap-4">
          {TRACKS.map((t) => (
            <div key={t.slug} className="border-[3px] border-ink p-4">
              <a href={`/track?slug=${t.slug}`} className="font-bold uppercase underline">{t.name}</a>
              <div className="text-sm">Lead: {t.lead}</div>
              <p className="mt-2 text-sm">{t.desc}</p>
            </div>
          ))}
        </div>
      </main><Footer />
    </>
  );
}

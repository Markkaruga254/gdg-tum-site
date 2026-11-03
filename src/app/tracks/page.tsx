"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
export default function TracksPage() {
  const tracks = [
    { name: "Cloud", color: "blue", lead: "[Lead name]", desc: "[Description]" },
    { name: "Cybersecurity", color: "red", lead: "[Lead name]", desc: "[Description]" },
    { name: "Web", color: "green", lead: "[Lead name]", desc: "[Description]" },
    { name: "Women in Tech", color: "yellow", lead: "[Lead name]", desc: "[Description]" },
  ];
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <h1 className="font-display text-4xl uppercase">Tracks</h1>
        <div className="mt-6 grid gap-4">
          {tracks.map((t) => (
            <div key={t.name} className="border-[3px] border-ink p-4">
              <a href={`/track?slug=${t.name.toLowerCase().replace(/ /g,"-")}`} className="font-bold uppercase underline">{t.name}</a>
              <div className="text-sm">Lead: {t.lead}</div>
              <p className="mt-2 text-sm">{t.desc}</p>
            </div>
          ))}
        </div>
      </main><Footer />
    </>
  );
}

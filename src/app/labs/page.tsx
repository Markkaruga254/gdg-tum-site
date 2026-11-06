"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const planned = [
  { number: "01", title: "Learn by building", description: "Guided, practical sessions that turn concepts into working projects." },
  { number: "02", title: "Practice with others", description: "Work through challenges with support from track leads and fellow students." },
  { number: "03", title: "Share what you learn", description: "Document your work, publish your results and build a portfolio in public." },
];

export default function LabsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <p className="inline-block bg-yellow px-[10px] py-[5px] text-[11px] font-bold uppercase">Soon</p>
          <h1 className="mt-[14px] font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Labs</h1>
          <p className="mt-[14px] max-w-[620px] text-[17px] leading-[1.5]">
            Where students upskill with hands-on, guided practice.
          </p>
        </header>

        <section>
          <div className="border-b-[3px] border-ink px-[26px] py-[20px]">
            <h2 className="text-[13px] font-bold uppercase">Planned labs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {planned.map((lab, index) => (
              <article key={lab.number} className={`min-h-[220px] border-b-[3px] border-r-[3px] border-ink p-[22px] ${index === 1 ? "bg-yellow" : "bg-white"}`}>
                <span className="font-display text-[48px] leading-none">{lab.number}</span>
                <h3 className="mt-[18px] text-[20px] font-bold">{lab.title}</h3>
                <p className="mt-[10px] text-[13px] leading-[1.55]">{lab.description}</p>
                <p className="mt-[18px] text-[11px] font-bold uppercase">Details soon</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 border-t-[3px] border-ink md:grid-cols-[1fr_1fr]">
          <div className="border-b-[3px] border-ink px-[26px] py-[28px] md:border-b-0 md:border-r-[3px]">
            <h2 className="font-display text-[clamp(32px,5vw,56px)] uppercase leading-[.98]">Get told when labs open</h2>
            <p className="mt-[12px] max-w-[420px] text-[14px] leading-[1.5]">We are preparing the first guided labs. Updates will be shared here when registration opens.</p>
          </div>
          <div className="flex flex-col justify-center gap-[12px] px-[26px] py-[28px]">
            <label htmlFor="labs-email" className="text-[12px] font-bold uppercase">Email</label>
            <input id="labs-email" type="email" disabled placeholder="Coming soon" className="w-full border-[3px] border-ink bg-white px-[14px] py-[13px] text-[14px] disabled:bg-[#f5f5f5]" />
            <button type="button" disabled className="w-fit border-[3px] border-ink bg-ink px-[20px] py-[12px] text-[12px] font-bold uppercase text-white opacity-50">Coming soon</button>
            <p className="text-[11px]">Sign-up will open when the first labs are ready.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

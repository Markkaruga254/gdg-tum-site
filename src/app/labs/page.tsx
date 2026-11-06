"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const planned = [
  { title: "Cloud foundations", description: "Hands-on practice with cloud services and deployment." },
  { title: "Build and secure the web", description: "Create an application and learn how to protect it." },
  { title: "AI and data projects", description: "Work with practical data and machine-learning tools." },
];

export default function LabsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink bg-ink px-[26px] py-[34px] text-white">
          <span className="inline-block bg-yellow px-[10px] py-[4px] text-[11px] font-bold uppercase text-ink">Soon</span>
          <h1 className="mt-[16px] font-display text-[clamp(60px,9vw,120px)] uppercase leading-none">Labs</h1>
          <p className="mt-[12px] max-w-[600px] text-[17px] leading-[1.5]">Where students upskill with hands-on, guided practice.</p>
        </header>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-[10px] border-y-[3px] border-ink px-[26px] py-[18px]">
            <h2 className="text-[14px] font-bold uppercase">Planned labs</h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px] p-[20px]">
            {planned.map((lab) => (
              <article key={lab.title} className="border-[3px] border-ink bg-white p-[22px]">
                <span className="inline-block border-[3px] border-ink px-[10px] py-[4px] text-[11px] font-bold uppercase">Planned</span>
                <h3 className="my-[14px] text-[20px] font-bold leading-[1.25]">{lab.title}</h3>
                <p className="text-[14px] leading-[1.5] text-[#333]">{lab.description}</p>
                <span className="mt-[14px] inline-block text-[12px] font-bold uppercase">Details soon</span>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t-[3px] border-ink bg-red px-[26px] py-[30px]">
          <h2 className="mb-[14px] font-display text-[40px] uppercase leading-none">Get told when labs open</h2>
          <div className="flex max-w-[560px] flex-wrap border-[3px] border-ink bg-white">
            <label htmlFor="labs-email" className="sr-only">Email</label>
            <input id="labs-email" type="email" disabled placeholder="ENTER YOUR EMAIL" className="min-w-[160px] flex-1 border-0 bg-white px-[14px] py-[14px] text-[13px] font-bold disabled:opacity-100" />
            <button type="button" disabled className="border-0 bg-ink px-[22px] py-[14px] text-[13px] font-bold uppercase text-white opacity-60">Coming soon</button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      await new Promise((r) => setTimeout(r, 600));
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="border-t-[3px] border-ink">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b-[3px] border-ink p-6 md:border-b-0 md:border-r-[3px]">
          <p className="mb-2 text-xs font-bold uppercase">Newsletter</p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              aria-label="Email"
              className="flex-1 border-[3px] border-ink px-3 py-2"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "sending"}
            />
            <button className="border-[3px] border-ink bg-ink px-4 py-2 font-bold uppercase text-white" disabled={status === "sending" || !email.trim()}>
              {status === "sending" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
          {status === "ok" && <p className="mt-2 text-xs text-green font-bold uppercase">Subscribed.</p>}
          {status === "error" && <p className="mt-2 text-xs text-red font-bold uppercase">Try again.</p>}
        </div>
        <div className="flex items-center gap-4 p-6 text-sm font-bold uppercase">
          <a href="#" className="focus:outline focus:outline-2 focus:outline-ink">Twitter</a>
          <a href="#" className="focus:outline focus:outline-2 focus:outline-ink">GitHub</a>
          <a href="#" className="focus:outline focus:outline-2 focus:outline-ink">Discord</a>
          <a href="/gallery" className="focus:outline focus:outline-2 focus:outline-ink">Gallery</a>
        </div>
      </div>
    </footer>
  );
}

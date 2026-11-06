"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { signInGoogle } from "@/lib/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInGoogle();
    } catch {
      setError("Google sign-in could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto grid min-h-[calc(100vh-160px)] max-w-[1280px] grid-cols-1 border-b-[3px] border-ink md:grid-cols-[1fr_1fr]">
        <section className="flex flex-col justify-center border-b-[3px] border-ink px-[26px] py-[54px] md:border-b-0 md:border-r-[3px] md:px-[48px]">
          <p className="text-[12px] font-bold uppercase">GDG on Campus · Technical University of Mombasa</p>
          <h1 className="mt-[18px] font-display text-[clamp(60px,9vw,112px)] uppercase leading-[.9]">Sign in</h1>
          <p className="mt-[22px] max-w-[480px] text-[17px] leading-[1.55]">
            Track leads and admins sign in with Google to post events, writeups and updates.
          </p>
          {error && <p role="alert" className="mt-[22px] border-[3px] border-ink bg-red p-[12px] text-[13px] font-bold">{error}</p>}
          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={loading}
            className="mt-[30px] flex w-fit items-center gap-[12px] border-[3px] border-ink bg-yellow px-[22px] py-[15px] text-[12px] font-bold uppercase disabled:opacity-60"
          >
            <span aria-hidden="true" className="font-display text-[22px]">G</span>
            {loading ? "Signing in…" : "Continue with Google ↗"}
          </button>
        </section>
        <aside className="flex flex-col justify-center bg-blue px-[26px] py-[54px] text-white md:px-[48px]">
          <p className="text-[12px] font-bold uppercase">Just looking around?</p>
          <h2 className="mt-[16px] font-display text-[clamp(38px,5vw,64px)] uppercase leading-[.95]">The work is public.</h2>
          <p className="mt-[18px] max-w-[440px] text-[15px] leading-[1.6]">
            Not a lead yet? You can still read everything on the site without signing in.
          </p>
          <a href="/events" className="mt-[26px] w-fit border-[3px] border-white px-[18px] py-[12px] text-[12px] font-bold uppercase underline underline-offset-4">Explore events ↗</a>
        </aside>
      </main>
      <Footer />
    </>
  );
}

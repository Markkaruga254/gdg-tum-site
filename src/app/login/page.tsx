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
      <main className="flex justify-center border-b-[3px] border-ink bg-yellow px-[26px] py-[60px]">
        <section className="w-full max-w-[460px] border-[3px] border-ink bg-white p-[32px]">
          <h1 className="mb-[12px] font-display text-[56px] uppercase leading-none">Sign in</h1>
          <p className="mb-[22px] text-[15px] leading-[1.5]">Track leads and admins sign in with Google to post events, writeups and updates.</p>
          {error && <p role="alert" className="mb-[18px] border-[3px] border-ink bg-red p-[12px] text-[13px] font-bold">{error}</p>}
          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={loading}
            className="block w-full border-[3px] border-ink bg-ink px-[20px] py-[12px] text-center text-[12px] font-bold uppercase text-white disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Continue with Google ↗"}
          </button>
          <p className="mt-[18px] text-[12px] leading-[1.5]">Not a lead yet? You can still read everything on the site without signing in.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

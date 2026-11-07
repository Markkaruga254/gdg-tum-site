"use client";

import { useState, useSyncExternalStore } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { signInGoogle, signInE2E } from "@/lib/auth";

const subscribeToLocation = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};

const getE2EModeSnapshot = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_E2E_AUTH_ENABLED === "true" &&
  new URLSearchParams(window.location.search).get("e2e") === "1";

const getServerE2EModeSnapshot = () => false;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e2eMode = useSyncExternalStore(
    subscribeToLocation,
    getE2EModeSnapshot,
    getServerE2EModeSnapshot,
  );

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

  async function handleE2ESignIn(role: "admin" | "lead") {
    setLoading(true);
    setError(null);
    try {
      const email = role === "admin" ? "admin@e2e.test" : "lead@e2e.test";
      await signInE2E(email, "e2e-password");
    } catch {
      setError("The isolated E2E account could not sign in.");
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
          {e2eMode && (
            <div className="mt-[18px] border-t-[3px] border-ink pt-[14px]">
              <p className="mb-[10px] text-[10px] font-bold uppercase">Local E2E accounts</p>
              <button
                type="button"
                onClick={() => void handleE2ESignIn("lead")}
                disabled={loading}
                className="mb-[8px] block w-full border-[3px] border-ink px-[12px] py-[10px] text-[11px] font-bold uppercase disabled:opacity-60"
              >
                Sign in as test lead
              </button>
              <button
                type="button"
                onClick={() => void handleE2ESignIn("admin")}
                disabled={loading}
                className="block w-full border-[3px] border-ink px-[12px] py-[10px] text-[11px] font-bold uppercase disabled:opacity-60"
              >
                Sign in as test admin
              </button>
            </div>
          )}
          <p className="mt-[18px] text-[12px] leading-[1.5]">Not a lead yet? You can still read everything on the site without signing in.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

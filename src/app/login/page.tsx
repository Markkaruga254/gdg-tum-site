"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { signInGoogle } from "@/lib/auth";

export default function LoginPage() {
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        <h1 className="font-display text-4xl uppercase">Login</h1>
        <button onClick={() => signInGoogle()} className="mt-4 border-[3px] border-ink bg-yellow px-4 py-2 font-bold uppercase text-ink">Sign in with Google</button>
      </main><Footer />
    </>
  );
}

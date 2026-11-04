"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/Button";
import { signInGoogle } from "@/lib/auth";

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-4xl uppercase">Login</h1>
        <SectionHeader>Sign in</SectionHeader>
        <Button variant="dark" onClick={() => signInGoogle()}>
          Sign in with Google
        </Button>
      </main>
      <Footer />
    </>
  );
}

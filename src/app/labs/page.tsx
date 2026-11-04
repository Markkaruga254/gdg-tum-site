"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/Button";

export default function LabsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-4xl uppercase">Labs</h1>
        <SectionHeader>Soon</SectionHeader>
        <p className="mt-4">Where students upskill with hands-on, guided practice.</p>
        <Button variant="outline">More soon ↗</Button>
      </main>
      <Footer />
    </>
  );
}

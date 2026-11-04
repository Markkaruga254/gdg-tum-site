"use client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/Button";

export default function BlogPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <h1 className="font-display text-4xl uppercase">Blog</h1>
        <SectionHeader>Tech blog</SectionHeader>
        <p className="mt-4">Coming soon.</p>
        <Button variant="outline">Curated by GDG TUM Bot ↗</Button>
      </main>
      <Footer />
    </>
  );
}

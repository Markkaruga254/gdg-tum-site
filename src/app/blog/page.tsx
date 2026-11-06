"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getPosts, type PostWithId } from "@/lib/data";

const categories = ["All", "Mobile", "Cloud", "AI / ML", "Web", "Cybersecurity", "DevOps"];

function categoryColor(tag: string): "blue" | "red" | "green" | "yellow" | "ink" {
  const normalized = tag.toLowerCase();
  if (normalized.includes("cloud")) return "blue";
  if (normalized.includes("cyber")) return "red";
  if (normalized.includes("ai") || normalized.includes("ml")) return "yellow";
  if (normalized.includes("devops")) return "ink";
  return "green";
}

function categoryMatch(post: PostWithId, category: string) {
  if (category === "All") return true;
  const target = category.toLowerCase().replace(/[^a-z0-9]/g, "");
  return post.tags.some((tag) => tag.toLowerCase().replace(/[^a-z0-9]/g, "").includes(target));
}

export default function BlogPage() {
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [category, setCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setPosts(await getPosts());
      } catch {
        setError("The tech blog is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = posts.filter((post) => post.hidden !== true && categoryMatch(post, category));
  const visible = filtered.slice(0, visibleCount);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Tech blog</h1>
          <p className="mt-[14px] max-w-[620px] text-[17px] leading-[1.5]">
            News for student developers, picked for our tracks.
          </p>
          <div className="mt-[14px]"><Tag label="Curated by GDG TUM Bot" color="ink" /></div>
        </header>

        <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Filter articles by topic">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setCategory(item); setVisibleCount(6); }}
              aria-pressed={category === item}
              className={`border-r-[3px] border-ink px-[22px] py-[16px] text-[12px] font-bold uppercase ${category === item ? "bg-yellow" : "bg-white"}`}
            >
              {item}
            </button>
          ))}
        </nav>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[18px] font-bold">{error}</p>}
        {loading ? (
          <p className="px-[26px] py-[24px] text-[13px] font-bold uppercase">Loading articles…</p>
        ) : visible.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[28px] text-[13px] font-bold uppercase">
            {posts.length ? "No articles in this topic yet." : "No articles have been published yet."}
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px] p-[20px]">
            {visible.map((post) => (
              <article key={post.id} className="border-[3px] border-ink bg-white p-[22px]">
                <div className="flex flex-wrap gap-[6px]">
                  {post.tags.slice(0, 3).map((tag) => <Tag key={tag} label={tag} color={categoryColor(tag)} />)}
                </div>
                <h2 className="mt-[14px] text-[20px] font-bold leading-[1.25]">{post.title}</h2>
                <p className="mt-[8px] text-[14px] leading-[1.5] text-[#333]">{post.summary}</p>
                <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-[14px] inline-block text-[12px] font-bold uppercase underline underline-offset-4">Source ↗</a>
              </article>
            ))}
          </div>
        )}

        {!loading && visible.length < filtered.length && (
          <div className="flex justify-center px-0 pb-[26px]">
            <button type="button" onClick={() => setVisibleCount((count) => count + 6)} className="border-[3px] border-ink px-[22px] py-[12px] text-[12px] font-bold uppercase">Load more ↓</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getPosts, type PostWithId } from "@/lib/data";

const categories = ["All", "Mobile", "Cloud", "AI / ML", "Web", "Cybersecurity", "DevOps"];

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

  const filtered = posts.filter((post) => categoryMatch(post, category));
  const visible = filtered.slice(0, visibleCount);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <p className="text-[12px] font-bold uppercase">Curated by GDG TUM Bot</p>
          <h1 className="mt-[12px] font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Tech blog</h1>
          <p className="mt-[14px] max-w-[620px] text-[17px] leading-[1.5]">
            News for student developers, picked for our tracks.
          </p>
        </header>

        <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Filter articles by topic">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setCategory(item); setVisibleCount(6); }}
              aria-pressed={category === item}
              className={`border-r-[3px] border-ink px-[18px] py-[15px] text-[11px] font-bold uppercase sm:px-[22px] sm:text-[12px] ${category === item ? "bg-yellow" : "bg-white"}`}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((post, index) => (
              <article key={post.id} className={`flex min-h-[250px] flex-col border-b-[3px] border-r-[3px] border-ink p-[22px] ${index % 4 === 1 ? "bg-yellow" : "bg-white"}`}>
                <div className="flex flex-wrap gap-[6px]">
                  {post.tags.slice(0, 3).map((tag) => <span key={tag} className="border-[2px] border-ink px-[8px] py-[4px] text-[10px] font-bold uppercase">{tag}</span>)}
                </div>
                <h2 className="mt-[18px] text-[21px] font-bold leading-[1.2]">{post.title}</h2>
                <p className="mt-[10px] text-[13px] leading-[1.55]">{post.summary}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-[20px]">
                  <span className="text-[11px] font-bold uppercase">{post.sourceName}</span>
                  <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold uppercase underline underline-offset-4">Source ↗</a>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && visible.length < filtered.length && (
          <div className="border-t-[3px] border-ink px-[26px] py-[22px] text-center">
            <button type="button" onClick={() => setVisibleCount((count) => count + 6)} className="border-[3px] border-ink px-[22px] py-[12px] text-[12px] font-bold uppercase">Load more ↓</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

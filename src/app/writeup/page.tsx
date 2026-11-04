"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getWriteupById, getUserById, getWriteups, getMediaByWriteup, type WriteupWithId, type AppUserWithId, type MediaWithId } from "@/lib/data";
import { trackTagColor } from "@/lib/tracks";

function View() {
  const params = useSearchParams();
  const id = params.get("id");
  const [w, setW] = useState<WriteupWithId | null>(null);
  const [author, setAuthor] = useState<AppUserWithId | null>(null);
  const [related, setRelated] = useState<WriteupWithId[]>([]);
  const [media, setMedia] = useState<MediaWithId[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    (async () => {
      const data = await getWriteupById(id);
      if (data) {
        setW(data);
        if (data.authorId) {
          try {
            const a = await getUserById(data.authorId);
            if (a) setAuthor(a);
          } catch {
            // Author profile not readable by public visitors (T05); continue without author info.
          }
        }
        try {
          const r = await getWriteups({ status: "published", trackId: data.trackId });
          setRelated(r.filter((x) => x.id !== id));
        } catch {
          setRelated([]);
        }
        try {
          const m = await getMediaByWriteup(id);
          setMedia(m);
        } catch {
          setMedia([]);
        }
      }
      setLoading(false);
    })();
  }, [id]);
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        {loading && <p>Loading…</p>}
        {!loading && !w && <p>Not found.</p>}
        {w && (
          <>
            <h1 className="font-display text-4xl uppercase">{w.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Tag label={w.trackId} color={trackTagColor(w.trackId)} />
              {author && <a href={`/lead?id=${author.id}`} className="text-sm underline">{author.name}</a>}
            </div>
            <p className="mt-4 text-sm">{w.summary}</p>
            <div className="mt-4">
              <ReactMarkdown>{w.body}</ReactMarkdown>
            </div>
            {media.length > 0 && (
              <section className="mt-4 grid gap-2">
                {media.map((m) => (
                  <figure key={m.id} className="border-[3px] border-ink p-2">
                    <img src={m.url} alt={m.altText || ""} className="block max-w-full" />
                    {m.caption && <figcaption className="text-sm">{m.caption}</figcaption>}
                  </figure>
                ))}
              </section>
            )}
            {related.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-2xl uppercase">Related</h2>
                {related.map((r) => (
                  <a key={r.id} href={`/writeup?id=${r.id}`} className="block border-[3px] border-ink p-3 mt-2">{r.title}</a>
                ))}
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Writeup, AppUser } from "@/lib/types";

function View() {
  const params = useSearchParams();
  const id = params.get("id");
  const [w, setW] = useState<Writeup | null>(null);
  const [author, setAuthor] = useState<AppUser | null>(null);
  const [related, setRelated] = useState<Writeup[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false); return; }
    (async () => {
      const snap = await getDoc(doc(db, "writeups", id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Writeup;
        setW(data);
        if (data.authorId) {
          try {
            const a = await getDoc(doc(db, "users", data.authorId));
            if (a.exists()) setAuthor({ id: a.id, ...a.data() } as AppUser);
          } catch {
            // Author profile not readable by public visitors (T05); continue without author info.
          }
        }
        const r = await getDocs(query(collection(db, "writeups"), where("status", "==", "published"), where("trackId", "==", data.trackId)));
        setRelated(r.docs.map((d) => ({ id: d.id, ...d.data() } as Writeup)).filter((x) => x.id !== id));
        let media: any[] = [];
        try {
          const m = await getDocs(query(collection(db, "media"), where("writeupId", "==", id)));
          media = m.docs.map((d) => ({ id: d.id, ...d.data() })) as any;
        } catch {
          media = [];
        }
        setMedia(media);
      }
      setLoading(false);
    })();
  }, [id]);
  return (
    <>
      <Nav /><main className="mx-auto max-w-[1280px] p-6">
        {loading && <p>Loading…</p>}
        {!loading && !w && <p>Not found.</p>}
        {w && (
          <>
            <h1 className="font-display text-4xl uppercase">{w.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Tag label={w.trackId} color="blue" />
              {author && <a href={`/lead?id=${author.id}`} className="text-sm underline">{author.name}</a>}
            </div>
            <p className="mt-4 text-sm">{w.summary}</p>
            <div className="prose mt-4 max-w-none">
              <ReactMarkdown>{w.body}</ReactMarkdown>
            </div>
            {media.length > 0 && (
              <section className="mt-4 grid gap-2">
                {media.map((m) => (
                  <figure key={m.id} className="border-[3px] border-ink p-2">
                    <img src={m.url} alt={m.altText || ""} />
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
      </main><Footer />
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><View /></Suspense>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";
import { getGalleryPage, type Photo, type GalleryPage } from "@/lib/gallery";
import { trackFilterOptions, TRACK_BG_COLORS, trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

const FILTERS = trackFilterOptions();

export default function Gallery() {
  const [trackFilter, setTrackFilter] = useState<TrackSlug | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nextCursor, setNextCursor] = useState<GalleryPage["nextCursor"]>(null);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMore = !!nextCursor;
  const photosRef = useRef<Photo[]>([]);

  async function loadPage(append: boolean) {
    setLoading(true);
    setError("");
    try {
      const page = await getGalleryPage({ trackId: trackFilter, cursor: append ? nextCursor : undefined, pageSize: 6 });
      const newPhotos = append ? [...photosRef.current, ...page.photos] : page.photos;
      photosRef.current = newPhotos;
      setPhotos(newPhotos);
      setNextCursor(page.nextCursor);
    } catch {
      setError("Photos could not be loaded.");
    } finally {
      setLoading(false);
      setMoreLoading(false);
    }
  }

  useEffect(() => {
    photosRef.current = [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(false);
  }, [trackFilter]);

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const contactHref = contactEmail ? `mailto:${contactEmail}` : undefined;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="px-[26px] py-[34px] border-b-[3px] border-ink">
          <h1 className="font-display uppercase" style={{ fontSize: "clamp(60px, 9vw, 120px)" }}>
            Moments
          </h1>
          <p className="mt-4 text-[17px] max-w-[560px]">
            Photos from our events and sessions, across all tracks.
          </p>
        </header>

        <div className="border-b-[3px] border-ink flex flex-wrap">
          {FILTERS.map((f) => {
            const active = f.trackId === trackFilter || (f.trackId === undefined && trackFilter === undefined);
            return (
              <button
                key={f.label}
                onClick={() => setTrackFilter(f.trackId)}
                aria-pressed={active}
                className={`px-[16px] py-[22px] border-r-[3px] border-ink font-bold uppercase text-[12px] focus:outline focus:outline-2 focus:outline-ink ${active ? "bg-[#FBBC04]" : ""}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {error && (
          <section className="border-b-[3px] border-ink bg-red p-4 text-sm text-white">
            {error}
          </section>
        )}

        <div className="p-[20px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[16px]">
          {photos.length === 0 && !loading ? (
            <p className="col-span-full text-center text-sm">No photos yet</p>
          ) : (
            photos.map((photo) => (
              <a key={photo.mediaId} href={`/writeup?id=${photo.writeupId}`} className="border-[3px] border-ink flex flex-col min-h-[240px]">
                <div className="flex-1 relative overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.altText}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      const wrapper = el.closest(".flex-1") as HTMLElement | null;
                      if (wrapper) {
                        wrapper.style.backgroundColor = TRACK_BG_COLORS[photo.trackId as TrackSlug];
                      }
                    }}
                  />
                  <div className={`absolute inset-0`} style={{ backgroundColor: TRACK_BG_COLORS[photo.trackId as TrackSlug] }} />
                </div>
                <div className="border-t-[3px] border-ink p-[10px_12px] text-[13px] font-bold bg-white">
                  {photo.caption}
                </div>
                <Tag label={photo.trackId} color={trackTagColor(photo.trackId)} />
              </a>
            ))
          )}
        </div>

        {hasMore && !moreLoading && !error && (
          <button
            onClick={() => { setMoreLoading(true); loadPage(true); }}
            className="mx-auto border-[3px] border-ink px-[14px] py-[26px] font-bold uppercase text-[12px] focus:outline focus:outline-2 focus:outline-ink"
          >
            Load more ↓
          </button>
        )}
        {moreLoading && <p className="text-center text-sm">Loading more…</p>}

        <footer className="border-t-[3px] border-ink px-[26px] py-[18px] flex justify-between items-center text-[13px]">
          <span>Click a photo to open its event writeup.</span>
          <div className="flex items-center gap-1">
            <span className="font-bold">Want a photo removed? </span>
            {contactHref ? (
              <a href={contactHref} target="_blank" rel="noopener noreferrer" className="focus:outline focus:outline-2 focus:outline-ink underline">
                Contact us
              </a>
            ) : (
              <span>Contact us</span>
            )}
          </div>
        </footer>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PhotoCard from "@/components/PhotoCard";
import { getGalleryPage, getPublishedGalleryPhotos, type Photo, type GalleryPage } from "@/lib/gallery";
import { trackFilterOptions, TRACK_BG_COLORS, trackTagColor } from "@/lib/tracks";
import type { TrackSlug } from "@/lib/types";

const FILTERS = trackFilterOptions();

export default function Gallery() {
  const [trackFilter, setTrackFilter] = useState<TrackSlug | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nextCursor, setNextCursor] = useState<GalleryPage["nextCursor"]>(null);
  const [overflowPhotos, setOverflowPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photosRef = useRef<Photo[]>([]);
  const hasMore = overflowPhotos.length > 0 || !!nextCursor;

  async function loadNextPage() {
    if (overflowPhotos.length === 0 && !nextCursor) return;
    setMoreLoading(true);
    setError(null);
    try {
      if (overflowPhotos.length > 0) {
        const nextPhotos = overflowPhotos.slice(0, 6);
        const remaining = overflowPhotos.slice(6);
        const newPhotos = [...photosRef.current, ...nextPhotos];
        photosRef.current = newPhotos;
        setPhotos(newPhotos);
        setOverflowPhotos(remaining);
      } else if (nextCursor) {
        const page = await getGalleryPage({ trackId: trackFilter, cursor: nextCursor, pageSize: 6 });
        const newPhotos = [...photosRef.current, ...page.photos];
        photosRef.current = newPhotos;
        setPhotos(newPhotos);
        setOverflowPhotos(page.overflowPhotos);
        setNextCursor(page.nextCursor);
      }
    } catch {
      setError("More photos could not be loaded. Please try again.");
    } finally {
      setMoreLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [page, standalonePhotos] = await Promise.all([
          getGalleryPage({ trackId: trackFilter, pageSize: 6 }),
          getPublishedGalleryPhotos(trackFilter),
        ]);
        if (!active) return;
        const initialPhotos = [...standalonePhotos, ...page.photos];
        photosRef.current = initialPhotos;
        setPhotos(initialPhotos);
        setOverflowPhotos(page.overflowPhotos);
        setNextCursor(page.nextCursor);
      } catch {
        if (active) setError("Photos could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [trackFilter]);

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const contactHref = contactEmail ? `mailto:${contactEmail}` : undefined;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1280px]">
        <header className="border-b-[3px] border-ink px-[26px] py-[34px]">
          <h1 className="font-display text-[clamp(60px,9vw,120px)] uppercase leading-[.95]">Moments</h1>
          <p className="mt-[14px] max-w-[560px] text-[17px] leading-[1.5]">
            Photos from our events and sessions, across all tracks.
          </p>
        </header>

        <nav className="flex flex-wrap border-b-[3px] border-ink" aria-label="Filter photos by track">
          {FILTERS.map((filter) => {
            const active = filter.trackId === trackFilter;
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => { if (filter.trackId === trackFilter) return; photosRef.current = []; setPhotos([]); setOverflowPhotos([]); setNextCursor(null); setError(null); setLoading(true); setTrackFilter(filter.trackId); }}
                aria-pressed={active}
                className={`whitespace-nowrap border-r-[3px] border-ink px-[22px] py-[16px] text-[12px] font-bold uppercase ${active ? "bg-yellow" : "bg-white"}`}
              >
                {filter.label}
              </button>
            );
          })}
        </nav>

        {error && <p role="alert" className="border-b-[3px] border-ink bg-red px-[26px] py-[16px] text-[13px] font-bold">{error}</p>}

        {loading ? (
          <p className="px-[26px] py-[24px] text-center text-[13px] font-bold uppercase">Loading moments…</p>
        ) : photos.length === 0 ? (
          <p className="border-b-[3px] border-ink px-[26px] py-[32px] text-center text-[13px] font-bold uppercase">No photos in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[16px] p-[20px]">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.mediaId}
                url={photo.url}
                caption={photo.caption}
                altText={photo.altText}
                trackId={photo.trackId}
                writeupId={photo.writeupId}
                href={photo.eventId ? `/event?id=${photo.eventId}` : photo.writeupId ? `/writeup?id=${photo.writeupId}` : undefined}
                tagColor={trackTagColor(photo.trackId as TrackSlug)}
                bg={TRACK_BG_COLORS[photo.trackId as TrackSlug] ?? "#111"}
              />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center pb-[26px]">
            <button
              type="button"
              onClick={() => void loadNextPage()}
              disabled={moreLoading}
              className="border-[3px] border-ink px-[22px] py-[12px] text-[12px] font-bold uppercase disabled:opacity-50"
            >
              {moreLoading ? "Loading…" : "Load more ↓"}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-[10px] border-t-[3px] border-ink px-[26px] py-[18px] text-[11px] font-bold uppercase sm:flex-row sm:items-center sm:justify-between sm:text-[12px]">
          <span>Photos linked to an event or writeup open their story.</span>
          <div className="flex flex-wrap items-center gap-1">
            <span>Want a photo removed?</span>
            {contactHref ? <a href={contactHref} className="underline underline-offset-4">Contact us ↗</a> : <span>Contact us</span>}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

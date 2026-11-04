"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PhotoCard from "@/components/PhotoCard";
import Button from "@/components/Button";
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
        <header className="p-[34px] p-[26px] border-b-[3px] border-ink">
          <h1 className="font-display font-normal uppercase" style={{ fontSize: "clamp(60px, 9vw, 120px)" }}>
            Moments
          </h1>
          <p className="mt-[14px] text-[17px] max-w-[560px] leading-[1.5]">
            Photos from our events and sessions, across all tracks.
          </p>
        </header>

        <div className="border-b-[3px] border-ink flex flex-wrap">
          {FILTERS.map((f) => {
            const active = f.trackId === trackFilter || (f.trackId === undefined && trackFilter === undefined);
            return (
              <a
                key={f.label}
                onClick={(e) => { e.preventDefault(); setTrackFilter(f.trackId); }}
                aria-pressed={active}
                className={`px-[22px] py-[16px] border-r-[3px] border-ink font-bold uppercase text-[12px] ${active ? "bg-[#FBBC04]" : ""} whitespace-nowrap`}
              >
                {f.label}
              </a>
            );
          })}
        </div>

        {error && (
          <section className="border-b-[3px] border-ink bg-red p-4 text-sm text-white">
            {error}
          </section>
        )}

        <div className="gap-[16px] p-[20px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          {photos.length === 0 && !loading ? (
            <p className="col-span-full text-center text-sm">No photos yet</p>
          ) : (
            photos.map((photo) => (
              <PhotoCard
                key={photo.mediaId}
                url={photo.url}
                caption={photo.caption}
                trackId={photo.trackId}
                writeupId={photo.writeupId}
                tagColor={trackTagColor(photo.trackId as TrackSlug)}
                bg={TRACK_BG_COLORS[photo.trackId as TrackSlug] ?? "#111"}
              />
            ))
          )}
        </div>

        {hasMore && !moreLoading && !error && (
          <Button variant="outline" className="mx-auto">
            Load more ↓
          </Button>
        )}
        {moreLoading && <p className="text-center text-sm">Loading more…</p>}

        <footer className="border-t-[3px] border-ink px-[26px] py-[18px] flex justify-between items-center text-[13px] font-bold uppercase">
          <span>Click a photo to open its event writeup.</span>
          <div className="flex items-center gap-1">
            <span className="font-bold uppercase">Want a photo removed? </span>
            {contactHref ? (
              <a href={contactHref} target="_blank" rel="noopener noreferrer" className="underline focus:outline focus:outline-2 focus:outline-ink">
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

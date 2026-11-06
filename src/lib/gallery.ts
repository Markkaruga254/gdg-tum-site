/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TrackSlug } from "@/lib/types";

export interface Photo {
  mediaId: string;
  url: string;
  caption: string;
  altText: string;
  writeupId: string;
  writeupTitle: string;
  trackId: TrackSlug;
  publishedAt: unknown;
}

export interface GalleryPage {
  photos: Photo[];
  overflowPhotos: Photo[];
  nextCursor: QueryDocumentSnapshot | null;
}

const CLOUDINARY_UPLOAD_PREFIX = "/upload/";

export function cloudThumb(url: string, width: number): string {
  const idx = url.indexOf(CLOUDINARY_UPLOAD_PREFIX);
  if (idx === -1) return url;
  const before = url.slice(0, idx + CLOUDINARY_UPLOAD_PREFIX.length);
  const after = url.slice(idx + CLOUDINARY_UPLOAD_PREFIX.length);
  return `${before}w_${width},q_auto,f_auto/${after}`;
}

export async function getGalleryPage({
  trackId,
  cursor,
  pageSize,
}: {
  trackId?: TrackSlug;
  cursor?: QueryDocumentSnapshot | null;
  pageSize?: number;
}): Promise<GalleryPage> {
  const constraints: any[] = [
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit((pageSize ?? 6) + 1),
  ];
  if (trackId) constraints.push(where("trackId", "==", trackId));
  if (cursor) constraints.push(startAfter(cursor));

  const q = query(collection(db, "writeups"), ...constraints);
  const snap = await getDocs(q);
  const pageDocs = snap.docs.slice(0, pageSize ?? 6);

  const allPhotos: Photo[] = [];
  for (const docRef of pageDocs) {
    const writeup = { id: docRef.id, ...docRef.data() } as unknown as {
      id: string;
      title: string;
      trackId: TrackSlug;
      publishedAt: unknown;
    };
    const mSnap = await getDocs(query(collection(db, "media"), where("writeupId", "==", docRef.id)));
    for (const mDoc of mSnap.docs) {
      const media = { id: mDoc.id, ...mDoc.data() } as unknown as {
        id: string;
        url: string;
        caption?: string;
        altText?: string;
      };
      allPhotos.push({
        mediaId: media.id,
        url: cloudThumb(media.url, 600),
        caption: media.caption ?? writeup.title,
        altText: media.altText ?? media.caption ?? writeup.title,
        writeupId: writeup.id,
        writeupTitle: writeup.title,
        trackId: writeup.trackId,
        publishedAt: writeup.publishedAt,
      });
    }
  }

  const size = pageSize ?? 6;
  const nextCursor = snap.docs.length > size && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;
  return {
    photos: allPhotos.slice(0, size),
    overflowPhotos: allPhotos.slice(size),
    nextCursor,
  };
}

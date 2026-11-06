import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type QueryConstraint,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Event, Writeup, Track, AppUser, Post, Partner, Media, Ticker,
  TrackSlug,
} from "@/lib/types";

export type EventWithId = Event & { id: string };
export type WriteupWithId = Writeup & { id: string };
export type TrackWithId = Track & { id: string };
export type AppUserWithId = AppUser & { id: string };
export type PostWithId = Post & { id: string };
export type PartnerWithId = Partner & { id: string };
export type MediaWithId = Media & { id: string };
export type TickerWithId = Ticker & { id: string };

export type { TrackSlug };

function mapDocRaw<T>(docSnap: { id: string; data(): DocumentData }): T & { id: string } {
  return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
}

export function mapDocs<T>(docs: { id: string; data(): DocumentData }[]): (T & { id: string })[] {
  return docs.map((d) => mapDocRaw<T>(d));
}

export async function getDocById<T>(collectionName: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return mapDocRaw<T>(snap);
}

export async function getCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<(T & { id: string })[]> {
  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  return mapDocs<T>(snap.docs);
}

export async function getEvents({
  trackId,
  status,
  orderAsc,
}: { trackId?: TrackSlug; status?: Event["status"]; orderAsc?: boolean } = {}): Promise<EventWithId[]> {
  const constraints: QueryConstraint[] = [orderBy("date", orderAsc ? "asc" : "desc")];
  if (trackId) constraints.push(where("trackId", "==", trackId));
  if (status) constraints.push(where("status", "==", status));
  return getCollection<Event>("events", constraints);
}

export async function getEventById(id: string): Promise<EventWithId | null> {
  return getDocById<Event>("events", id);
}

export async function getWriteups({
  status,
  trackId,
  authorId,
  limitCount,
}: {
  status?: Writeup["status"];
  trackId?: TrackSlug;
  authorId?: string;
  limitCount?: number;
} = {}): Promise<WriteupWithId[]> {
  const constraints: QueryConstraint[] = [];
  if (status) constraints.push(where("status", "==", status));
  if (status === "published") constraints.push(orderBy("publishedAt", "desc"));
  if (trackId) constraints.push(where("trackId", "==", trackId));
  if (authorId) constraints.push(where("authorId", "==", authorId));
  if (limitCount) constraints.push(limit(limitCount));
  return getCollection<Writeup>("writeups", constraints);
}

export async function getWriteupById(id: string): Promise<WriteupWithId | null> {
  return getDocById<Writeup>("writeups", id);
}

export async function getTracks(): Promise<TrackWithId[]> {
  return getCollection<Track>("tracks");
}

export async function getTrackBySlug(slug: TrackSlug): Promise<TrackWithId | null> {
  const snaps = await getCollection<Track>("tracks", [where("slug", "==", slug)]);
  return snaps.length > 0 ? snaps[0] : null;
}

export async function getUsers(role?: AppUser["role"]): Promise<AppUserWithId[]> {
  const constraints: QueryConstraint[] = [];
  if (role) constraints.push(where("role", "==", role));
  return getCollection<AppUser>("users", constraints);
}

export async function getUserById(id: string): Promise<AppUserWithId | null> {
  return getDocById<AppUser>("users", id);
}

export async function getPartners(): Promise<PartnerWithId[]> {
  return getCollection<Partner>("partners", [where("active", "==", true), orderBy("order", "asc")]);
}

export async function getMediaByWriteup(writeupId: string): Promise<MediaWithId[]> {
  return getCollection<Media>("media", [where("writeupId", "==", writeupId)]);
}

export async function getPosts(): Promise<PostWithId[]> {
  return getCollection<Post>("posts", [orderBy("fetchedAt", "desc")]);
}

export async function getTicker(): Promise<TickerWithId[]> {
  return getCollection<Ticker>("ticker");
}

const EMPTY_QUERY_CONSTRAINTS: QueryConstraint[] = [];

export function useCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = EMPTY_QUERY_CONSTRAINTS,
  options: { enabled?: boolean } = {},
): {
  data: (T & { id: string })[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (options.enabled === false) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, collectionName), ...constraints);
      const snap = await getDocs(q);
      setData(mapDocs<T>(snap.docs));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [collectionName, constraints, options.enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

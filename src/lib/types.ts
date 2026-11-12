import type { Timestamp } from "firebase/firestore";

export type TrackSlug = "cloud" | "cybersecurity" | "web" | "women-in-tech" | "ai-ml" | "mobile" | "hackathons-solutions";
export type EventCategory = TrackSlug | "chapter";
export type TrackColor = "blue" | "red" | "green" | "yellow";

export interface Track {
  // `slug` is the key trackId references hold; `id` matches it for documents
  // created by scripts/seed.ts, but legacy rows seeded via add() have random ids.
  id: string;
  name: string;
  slug: TrackSlug;
  color: TrackColor;
  description: string;
  leadIds: string[];
}

export interface Event {
  id: string;
  title: string;
  trackId: EventCategory;
  date: Timestamp;
  venue: string;
  description?: string;
  sourceUrl?: string;
  status: "upcoming" | "live" | "past" | "cancelled";
  cancelledBy?: string;
  cancelledAt?: Timestamp;
  attendance?: number;
  rsvpCount?: number;
  writeupId?: string;
}

export interface Writeup {
  id: string;
  eventId: string;
  trackId: TrackSlug;
  authorId: string;
  title: string;
  summary: string;
  body: string;
  attendance?: number;
  links: { title: string; url: string }[];
  tags: { topics: string[]; products: string[] };
  status: "draft" | "published";
  aiDrafted: boolean;
  publishedAt?: Timestamp;
}

export interface AppUser {
  id: string;
  name: string;
  role: "admin" | "lead" | "member";
  /** Set when the person leads one of the published tracks. */
  track?: TrackSlug | null;
  /** Public-facing position; supports chapter and cross-track leadership roles. */
  leadershipTitle?: string;
  /** Explicitly hide internal/test leadership accounts from public directories. Defaults to visible. */
  directoryVisible?: boolean;
  photoUrl?: string;
  bio?: string;
  links?: { title: string; url: string }[];
}

export interface Post {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  fetchedAt: Timestamp;
  hidden?: boolean;
}

export interface Ticker {
  id: string;
  eventId: string;
  message: string;
  status: "active" | "inactive";
  createdBy: string;
  updatedAt: Timestamp;
}

export type PartnerType = "university" | "community" | "sponsor" | "company";

export interface Partner {
  id: string;
  name: string;
  logoUrl?: string;
  link: string;
  type: PartnerType;
  order: number;
  active: boolean;
}

export interface Media {
  id: string;
  writeupId: string;
  url: string;
  publicId?: string;
  caption?: string;
  altText?: string;
  captionSource?: string;
  createdBy?: string;
}

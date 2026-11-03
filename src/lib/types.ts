import type { Timestamp } from "firebase/firestore";

export type TrackSlug = "cloud" | "cybersecurity" | "web" | "women-in-tech";
export type TrackColor = "blue" | "red" | "green" | "yellow";

export interface Track {
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
  trackId: string;
  date: Timestamp;
  venue: string;
  status: "upcoming" | "live" | "past";
  attendance?: number;
  rsvpCount?: number;
  writeupId?: string;
}

export interface Writeup {
  id: string;
  eventId: string;
  trackId: string;
  authorId: string;
  title: string;
  summary: string;
  body: string;
  tags: { topics: string[]; products: string[] };
  status: "draft" | "published";
  aiDrafted: boolean;
  publishedAt?: Timestamp;
}

export interface AppUser {
  id: string;
  name: string;
  role: "admin" | "lead" | "member";
  track: TrackSlug;
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
}

export interface Ticker {
  id: string;
  eventId: string;
  message: string;
  status: "active" | "inactive";
  updatedAt: Timestamp;
}

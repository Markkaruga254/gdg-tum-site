import type { TrackColor, TrackSlug } from "@/lib/types";

export interface TrackConfig {
  slug: TrackSlug;
  name: string;
  color: TrackColor;
  description: string;
}

/**
 * Temporary public-profile fallback for the Cloud Track lead.
 * Firestore remains the primary source; this is used only if that record
 * cannot be loaded or is absent from the leadership query.
 */
export const TRACK_LEAD_FALLBACKS: Partial<Record<TrackSlug, { id: string; name: string; leadershipTitle: string }>> = {
  cloud: {
    id: "KoYwxs8piKh4c4tkcIHzOURzCwC3",
    name: "Mark Karuga",
    leadershipTitle: "Cloud Track Lead",
  },
};

export const TRACKS: TrackConfig[] = [
  { slug: "cloud", name: "Cloud", color: "blue", description: "Explore cloud platforms, infrastructure and deployment." },
  { slug: "cybersecurity", name: "Cybersecurity", color: "red", description: "Learn to identify risks and build more secure systems." },
  { slug: "web", name: "Web", color: "green", description: "Design, build and ship useful web experiences." },
  { slug: "women-in-tech", name: "Women in Tech", color: "yellow", description: "Create space for women to learn, collaborate and lead in technology." },
  { slug: "ai-ml", name: "AI/ML", color: "yellow", description: "Explore machine learning and AI by working with data, models and practical applications." },
  { slug: "mobile", name: "Mobile Development", color: "blue", description: "Learn to design and build useful applications for mobile devices." },
  { slug: "hackathons-solutions", name: "Hackathons & Solutions", color: "red", description: "Bring people together to solve real problems through collaborative, time-bound building challenges and hackathons." },
];

export const TRACK_BG_COLORS: Record<TrackSlug, string> = {
  cloud: "#1967D2",
  cybersecurity: "#EA4335",
  web: "#34A853",
  "women-in-tech": "#FBBC04",
  "ai-ml": "#FBBC04",
  mobile: "#1967D2",
  "hackathons-solutions": "#EA4335",
};

export function trackName(slug: TrackSlug): string {
  return TRACKS.find((track) => track.slug === slug)?.name ?? slug;
}

export function trackColor(slug: TrackSlug): TrackColor {
  return TRACKS.find((track) => track.slug === slug)?.color ?? "blue";
}

export function trackFilterOptions() {
  return [
    { label: "All", trackId: undefined as TrackSlug | undefined },
    ...TRACKS.map((track) => ({ label: track.name, trackId: track.slug })),
  ];
}

export function trackTagColor(slug: TrackSlug): TrackColor {
  return trackColor(slug);
}

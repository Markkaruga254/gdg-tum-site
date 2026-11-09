import type { TrackColor, TrackSlug } from "@/lib/types";

export interface TrackConfig {
  slug: TrackSlug;
  name: string;
  color: TrackColor;
}

export const TRACKS: TrackConfig[] = [
  { slug: "cloud", name: "Cloud", color: "blue" },
  { slug: "cybersecurity", name: "Cybersecurity", color: "red" },
  { slug: "web", name: "Web", color: "green" },
  { slug: "women-in-tech", name: "Women in Tech", color: "yellow" },
  { slug: "ai-ml", name: "AI/ML", color: "yellow" },
  { slug: "mobile", name: "Mobile Development", color: "blue" },
  { slug: "hackathons-solutions", name: "Hackathons & Solutions", color: "red" },
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

import type { TrackColor, TrackSlug } from "@/lib/types";

export interface TrackConfig {
  slug: TrackSlug;
  name: string;
  color: TrackColor;
  lead: string;
  desc: string;
}

export const TRACKS: TrackConfig[] = [
  { slug: "cloud", name: "Cloud", color: "blue", lead: "[Lead name]", desc: "[Track description placeholder]" },
  { slug: "cybersecurity", name: "Cybersecurity", color: "red", lead: "[Lead name]", desc: "[Track description placeholder]" },
  { slug: "web", name: "Web", color: "green", lead: "[Lead name]", desc: "[Track description placeholder]" },
  { slug: "women-in-tech", name: "Women in Tech", color: "yellow", lead: "[Lead name]", desc: "[Track description placeholder]" },
];

export const TRACK_BG_COLORS: Record<TrackSlug, string> = {
  cloud: "#1967D2",
  cybersecurity: "#EA4335",
  web: "#34A853",
  "women-in-tech": "#FBBC04",
};

export function trackColor(slug: TrackSlug): TrackColor {
  const t = TRACKS.find((x) => x.slug === slug);
  return t ? t.color : "blue";
}

export function trackFilterOptions() {
  return [
    { label: "All", trackId: undefined as TrackSlug | undefined },
    ...TRACKS.map((t) => ({ label: t.name, trackId: t.slug })),
  ];
}

export function trackTagColor(slug: TrackSlug): TrackColor {
  return trackColor(slug);
}

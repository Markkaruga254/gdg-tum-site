import type { EventCategory, TrackColor, TrackSlug } from "@/lib/types";

export interface TrackConfig {
  slug: TrackSlug;
  name: string;
  color: TrackColor;
  description: string;
}

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

export function trackName(slug: EventCategory): string {
  if (slug === "chapter") return "Chapter Events";
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

export function trackTagColor(slug: EventCategory): TrackColor {
  if (slug === "chapter") return "blue";
  return trackColor(slug);
}

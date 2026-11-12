import type { TrackSlug } from "@/lib/types";

const TRACK_LABELS: Record<TrackSlug, string> = {
  cloud: "Cloud",
  cybersecurity: "Cybersecurity",
  web: "Web",
  "women-in-tech": "Women in Tech",
  "ai-ml": "AI/ML",
  mobile: "Mobile Development",
  "hackathons-solutions": "Hackathons & Solutions",
};

export function leadDisplayName(
  name: string | null | undefined,
  track?: TrackSlug | null,
): string {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (normalizedName) return normalizedName;
  return track ? `${TRACK_LABELS[track]} Track Lead` : "GDG TUM Lead";
}

export function leadInitials(name: string | null | undefined): string {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedName) return "GD";
  return normalizedName
    .split(/\\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "GD";
}

export function isLeadDirectoryVisible(directoryVisible?: boolean): boolean {
  // Existing leadership profiles remain public unless explicitly hidden.
  return directoryVisible !== false;
}

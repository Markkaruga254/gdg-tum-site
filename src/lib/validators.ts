export type TrackSlug = "cloud" | "cybersecurity" | "web" | "women-in-tech";

export interface EventForm {
  title: string;
  date: string;
  venue: string;
  status: "upcoming" | "live" | "past";
  attendance: string;
  trackId: string;
}

export interface WriteupLink {
  title: string;
  url: string;
}

export interface WriteupForm {
  eventId: string;
  title: string;
  summary: string;
  body: string;
  attendance: string;
  links: WriteupLink[];
}

export const URL_RE = /^https?:\/\//;

export function validateEvent(form: EventForm, role: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Title required";
  if (!form.date) errors.date = "Date required";
  if (!form.venue.trim()) errors.venue = "Venue required";
  if (role === "admin" && !form.trackId) errors.trackId = "Track required";
  return errors;
}

export function validateWriteup(form: WriteupForm, publish: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Title required";
  if (!form.eventId) errors.eventId = "Event required";
  if (publish && !form.body.trim()) errors.body = "Body required to publish";
  if (form.attendance && Number(form.attendance) < 0) errors.attendance = "Attendance must be non-negative";
  const linkError = validateLinks(form.links);
  if (linkError) errors.links = linkError;
  return errors;
}

export function validateLinks(links: WriteupLink[]): string | null {
  const bad = links.some((l) => l.url && !URL_RE.test(l.url));
  return bad ? "Links must start with http(s)://" : null;
}

export function trackColor(slug: TrackSlug | string, tracks: { slug: string; color: string }[]): string {
  return tracks.find((t) => t.slug === slug)?.color ?? "blue";
}

export type TrackSlug = "cloud" | "cybersecurity" | "web" | "women-in-tech" | "ai-ml" | "mobile" | "hackathons-solutions";
export type PartnerType = "university" | "community" | "sponsor" | "company";

export interface EventForm {
  title: string;
  date: string;
  venue: string;
  description: string;
  status: "upcoming" | "live" | "past" | "cancelled";
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

export interface PartnerForm {
  name: string;
  link: string;
  type: PartnerType;
  order: string;
  active: boolean;
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
  else if (form.title.trim().length > 140) errors.title = "Title must be 140 characters or fewer.";
  if (!form.eventId) errors.eventId = "Event required";

  const summary = form.summary.trim();
  const summaryWords = summary.split(/\s+/).filter(Boolean).length;
  if (summaryWords > 40) errors.summary = "Summary must be 40 words or fewer.";
  else if (publish && !summary) errors.summary = "Summary required to publish";

  if (publish && !form.body.trim()) errors.body = "Body required to publish";
  else if (form.body.length > 100000) errors.body = "Article body must be 100,000 characters or fewer.";

  if (form.attendance.trim()) {
    const attendance = Number(form.attendance);
    if (!Number.isInteger(attendance) || attendance < 0) {
      errors.attendance = "Attendance must be a non-negative whole number";
    }
  }

  const linkError = validateLinks(form.links);
  if (linkError) errors.links = linkError;
  return errors;
}

export function validateLinks(links: WriteupLink[]): string | null {
  for (const link of links) {
    const title = link.title.trim();
    const url = link.url.trim();
    if (!title && !url) continue;
    if (!title || !url) return "Each resource link needs both a title and a URL.";
    if (title.length > 120 || url.length > 2048) return "Link titles must be 120 characters or fewer and URLs 2,048 characters or fewer.";
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
        return "Links must be valid http(s) URLs.";
      }
    } catch {
      return "Links must be valid http(s) URLs.";
    }
  }
  return null;
}

export function trackColor(slug: TrackSlug | string, tracks: { slug: string; color: string }[]): string {
  return tracks.find((t) => t.slug === slug)?.color ?? "blue";
}

export function validatePartner(form: PartnerForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name required";
  else if (form.name.length > 80) errors.name = "Name too long (max 80)";
  if (!URL_RE.test(form.link)) errors.link = "Link must start with http(s)://";
  if (!["university", "community", "sponsor", "company"].includes(form.type)) errors.type = "Type required";
  const order = Number(form.order);
  if (!Number.isInteger(order) || order < 0) errors.order = "Order must be a non-negative integer";
  return errors;
}

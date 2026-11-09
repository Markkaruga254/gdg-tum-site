import type { TrackSlug } from "@/lib/types";

interface LeadershipProfile {
  leadershipTitle: string;
  track: TrackSlug | null;
  links: { title: string; url: string }[];
}

// The published club roster is authoritative for public titles, track ownership
// and profile links. Firestore remains the source for document IDs and activity.
const leadershipProfiles: Record<string, LeadershipProfile> = {
  "mitchelle ndunge": {
    leadershipTitle: "Chapter Lead",
    track: null,
    links: [
      { title: "GitHub", url: "https://github.com/Dahliastar" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/michelle-ndunge-7815482a2/" },
    ],
  },
  "rooney odhiambo": {
    leadershipTitle: "VC Chair",
    track: null,
    links: [
      { title: "GitHub", url: "https://github.com/KabuorJnr" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/rooney-odhiambo-9a26b6256/" },
    ],
  },
  "mark karuga": {
    leadershipTitle: "Cloud Track Lead",
    track: "cloud",
    links: [
      { title: "GitHub", url: "https://github.com/Markkaruga254" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/mark-karuga" },
    ],
  },
  "lewis kagiri": {
    leadershipTitle: "AI/ML Track Lead",
    track: "ai-ml",
    links: [
      { title: "GitHub", url: "https://github.com/10kwise" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/lewis-ndegwa-683718294/" },
    ],
  },
  "ian chacha": {
    leadershipTitle: "Mobile Track Lead",
    track: "mobile",
    links: [{ title: "GitHub", url: "https://github.com/ianchacha" }],
  },
  "kimberly gift": {
    leadershipTitle: "Cybersecurity Track Lead",
    track: "cybersecurity",
    links: [
      { title: "GitHub", url: "https://github.com/kimmy-sec" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/gift-kimberly-bb784b419/" },
    ],
  },
  "larah flynn": {
    leadershipTitle: "Women in Tech Lead",
    track: "women-in-tech",
    links: [
      { title: "GitHub", url: "https://github.com/larah-del" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/larah-flynn-164b993a6/" },
    ],
  },
  "edith karanja": {
    leadershipTitle: "Hackathons & Solutions",
    track: "hackathons-solutions",
    links: [
      { title: "GitHub", url: "https://github.com/edithcalm" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/edith-karanja/" },
    ],
  },
  "sam ryan": {
    leadershipTitle: "Web Development Track",
    track: "web",
    links: [
      { title: "GitHub", url: "https://github.com/Ryanking254" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/samryan-adeny-6995a8436/" },
    ],
  },
};

export function withLeadershipMetadata<T extends {
  name: string;
  track?: TrackSlug | null;
  leadershipTitle?: string;
  links?: { title: string; url: string }[];
  bio?: string;
}>(user: T): T {
  const profile = leadershipProfiles[user.name.trim().toLowerCase()];
  if (!profile) return user;

  return {
    ...user,
    ...profile,
    // No biographies were supplied with the roster; don't display seed placeholder
    // text such as "Chapter lead" as if it were a personal biography.
    bio: "",
  };
}

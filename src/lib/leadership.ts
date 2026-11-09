import type { AppUser, TrackSlug } from "@/lib/types";

interface LeadershipProfile {
  leadershipTitle: string;
  track: TrackSlug | null;
  links: { title: string; url: string }[];
}

/**
 * Canonical public roster. These stable IDs match the demo seed IDs so profile
 * URLs remain consistent whether a lead has a Firestore user document or not.
 * Firestore remains authoritative for activity, photos and any other user data.
 */
export const PUBLIC_LEADERS: (AppUser & { id: string })[] = [
  {
    id: "u-lead-mitchelle",
    name: "Mitchelle Ndunge",
    role: "lead",
    leadershipTitle: "Chapter Lead",
    track: null,
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/Dahliastar" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/michelle-ndunge-7815482a2/" },
    ],
  },
  {
    id: "u-lead-rooney",
    name: "Rooney Odhiambo",
    role: "lead",
    leadershipTitle: "VC Chair",
    track: null,
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/KabuorJnr" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/rooney-odhiambo-9a26b6256/" },
    ],
  },
  {
    id: "u-lead-mark",
    name: "Mark Karuga",
    role: "lead",
    leadershipTitle: "Cloud Track Lead",
    track: "cloud",
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/Markkaruga254" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/mark-karuga" },
    ],
  },
  {
    id: "u-lead-lewis",
    name: "Lewis Kagiri",
    role: "lead",
    leadershipTitle: "AI/ML Track Lead",
    track: "ai-ml",
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/10kwise" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/lewis-ndegwa-683718294/" },
    ],
  },
  {
    id: "u-lead-ian",
    name: "Ian Chacha",
    role: "lead",
    leadershipTitle: "Mobile Track Lead",
    track: "mobile",
    bio: "",
    photoUrl: "",
    links: [{ title: "GitHub", url: "https://github.com/ianchacha" }],
  },
  {
    id: "u-lead-kimberly",
    name: "Kimberly Gift",
    role: "lead",
    leadershipTitle: "Cybersecurity Track Lead",
    track: "cybersecurity",
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/kimmy-sec" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/gift-kimberly-bb784b419/" },
    ],
  },
  {
    id: "u-lead-larah",
    name: "Larah Flynn",
    role: "lead",
    leadershipTitle: "Women in Tech Lead",
    track: "women-in-tech",
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/larah-del" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/larah-flynn-164b993a6/" },
    ],
  },
  {
    id: "u-lead-edith",
    name: "Edith Karanja",
    role: "lead",
    leadershipTitle: "Hackathons & Solutions",
    track: "hackathons-solutions",
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/edithcalm" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/edith-karanja/" },
    ],
  },
  {
    id: "u-lead-sam",
    name: "Sam Ryan",
    role: "lead",
    leadershipTitle: "Web Development Track",
    track: "web",
    bio: "",
    photoUrl: "",
    links: [
      { title: "GitHub", url: "https://github.com/Ryanking254" },
      { title: "LinkedIn", url: "https://www.linkedin.com/in/samryan-adeny-6995a8436/" },
    ],
  },
];

const leadershipProfiles: Record<string, LeadershipProfile> = Object.fromEntries(
  PUBLIC_LEADERS.map(({ name, leadershipTitle, track, links }) => [
    name.trim().toLowerCase(),
    { leadershipTitle: leadershipTitle!, track: track ?? null, links: links ?? [] },
  ]),
);

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

export function getPublicLeadershipRoster(): (AppUser & { id: string })[] {
  return PUBLIC_LEADERS.map((leader) => ({
    ...leader,
    links: leader.links?.map((link) => ({ ...link })),
  }));
}

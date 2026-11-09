import { describe, expect, it } from "vitest";
import type { AppUser } from "../types";
import { getPublicLeadershipRoster, withLeadershipMetadata } from "../leadership";

describe("withLeadershipMetadata", () => {
  it.each([
    ["Mitchelle Ndunge", "Chapter Lead", null],
    ["Rooney Odhiambo", "VC Chair", null],
    ["Mark Karuga", "Cloud Track Lead", "cloud"],
    ["Lewis Kagiri", "AI/ML Track Lead", "ai-ml"],
    ["Ian Chacha", "Mobile Track Lead", "mobile"],
    ["Kimberly Gift", "Cybersecurity Track Lead", "cybersecurity"],
    ["Larah Flynn", "Women in Tech Lead", "women-in-tech"],
    ["Edith Karanja", "Hackathons & Solutions", "hackathons-solutions"],
    ["Sam Ryan", "Web Development Track", "web"],
  ] as const)("maps %s to the published role and track", (name, title, track) => {
    const result = withLeadershipMetadata({
      id: "user-1",
      name,
      role: "lead" as const,
      track: "cloud" as const,
      bio: "seed placeholder",
      links: [],
    } as AppUser);

    expect(result.leadershipTitle).toBe(title);
    expect(result.track).toBe(track);
    expect(result.bio).toBe("");
    expect(result.links?.length).toBe(name === "Ian Chacha" ? 1 : 2);
  });

  it("leaves users outside the published roster unchanged", () => {
    const user = { id: "member-1", name: "Example Member", role: "member" as const, track: "cloud" as const };
    expect(withLeadershipMetadata(user)).toBe(user);
  });
});

describe("getPublicLeadershipRoster", () => {
  it("exposes all nine published leaders with stable profile IDs", () => {
    const roster = getPublicLeadershipRoster();
    expect(roster).toHaveLength(9);
    expect(roster.map(({ id }) => id)).toEqual([
      "u-lead-mitchelle",
      "u-lead-rooney",
      "u-lead-mark",
      "u-lead-lewis",
      "u-lead-ian",
      "u-lead-kimberly",
      "u-lead-larah",
      "u-lead-edith",
      "u-lead-sam",
    ]);
    expect(roster.every((leader) => leader.role === "lead")).toBe(true);
    expect(roster.find((leader) => leader.name === "Mark Karuga")?.track).toBe("cloud");
  });
});

import { describe, expect, it } from "vitest";
import { withLeadershipMetadata } from "../leadership";

describe("withLeadershipMetadata", () => {
  it.each([
    ["Mitchelle Ndunge", "Chapter Lead", null],
    ["Rooney Odhiambo", "Vice Chair", null],
    ["Mark Karuga", "Cloud Track Lead", "cloud"],
    ["Lewis Kagiri", "AI/ML Track Lead", null],
    ["Ian Chacha", "Mobile Track Lead", null],
    ["Kimberly Gift", "Cybersecurity Track Lead", "cybersecurity"],
    ["Larah Flynn", "Women in Tech Lead", "women-in-tech"],
    ["Edith Karanja", "Hackathons & Solutions", null],
    ["Sam Ryan", "Web Development Track Lead", "web"],
  ] as const)("maps %s to the published role and track", (name, title, track) => {
    const result = withLeadershipMetadata({
      id: "user-1",
      name,
      role: "lead" as const,
      track: "cloud" as const,
      bio: "seed placeholder",
      links: [],
    });

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

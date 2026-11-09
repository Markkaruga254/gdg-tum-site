import { describe, expect, it } from "vitest";
import { TRACKS, trackName, trackTagColor } from "../tracks";

describe("track configuration", () => {
  it("provides canonical display names without sample placeholders", () => {
    expect(TRACKS.map((track) => track.name)).toEqual([
      "Cloud",
      "Cybersecurity",
      "Web",
      "Women in Tech",
      "AI/ML",
      "Mobile Development",
      "Hackathons & Solutions",
    ]);
    expect(trackName("women-in-tech")).toBe("Women in Tech");
    expect(TRACKS).toHaveLength(7);
    expect(TRACKS.every((track) => track.description.trim().length > 0)).toBe(true);
    expect(TRACKS.every((track) => !/\[[^\]]+\]/.test(track.name))).toBe(true);
  });

  it("keeps the approved track tag colors", () => {
    expect(trackTagColor("cloud")).toBe("blue");
    expect(trackTagColor("cybersecurity")).toBe("red");
    expect(trackTagColor("web")).toBe("green");
    expect(trackTagColor("women-in-tech")).toBe("yellow");
    expect(trackTagColor("ai-ml")).toBe("yellow");
    expect(trackTagColor("mobile")).toBe("blue");
    expect(trackTagColor("hackathons-solutions")).toBe("red");
    expect(trackName("ai-ml")).toBe("AI/ML");
    expect(trackName("mobile")).toBe("Mobile Development");
    expect(trackName("hackathons-solutions")).toBe("Hackathons & Solutions");
  });
});

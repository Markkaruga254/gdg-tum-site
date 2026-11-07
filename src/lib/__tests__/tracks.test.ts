import { describe, expect, it } from "vitest";
import { TRACKS, trackName, trackTagColor } from "../tracks";

describe("track configuration", () => {
  it("provides canonical display names without sample placeholders", () => {
    expect(TRACKS.map((track) => track.name)).toEqual([
      "Cloud",
      "Cybersecurity",
      "Web",
      "Women in Tech",
    ]);
    expect(trackName("women-in-tech")).toBe("Women in Tech");
    expect(TRACKS.every((track) => !/\[[^\]]+\]/.test(track.name))).toBe(true);
  });

  it("keeps the approved track tag colors", () => {
    expect(trackTagColor("cloud")).toBe("blue");
    expect(trackTagColor("cybersecurity")).toBe("red");
    expect(trackTagColor("web")).toBe("green");
    expect(trackTagColor("women-in-tech")).toBe("yellow");
  });
});

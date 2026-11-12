import { describe, expect, it } from "vitest";
import { isLeadDirectoryVisible, leadDisplayName, leadInitials } from "@/lib/lead-profile";

describe("lead profile presentation", () => {
  it("uses a trimmed profile name when one exists", () => {
    expect(leadDisplayName("  Alex Kim  ", "cloud")).toBe("Alex Kim");
  });

  it("falls back to a track-specific title when the name is missing", () => {
    expect(leadDisplayName(undefined, "cloud")).toBe("Cloud Track Lead");
    expect(leadDisplayName("", "women-in-tech")).toBe("Women in Tech Track Lead");
  });

  it("falls back to a chapter title when both name and track are missing", () => {
    expect(leadDisplayName(null, null)).toBe("GDG TUM Lead");
  });

  it("creates safe initials for missing, blank, and multi-part names", () => {
    expect(leadInitials("Mark Karuga")).toBe("MK");
    expect(leadInitials("  Alex   Kim  ")).toBe("AK");
    expect(leadInitials(undefined)).toBe("GD");
    expect(leadInitials("   ")).toBe("GD");
  });

  it("keeps existing profiles public by default but respects an explicit opt-out", () => {
    expect(isLeadDirectoryVisible(undefined)).toBe(true);
    expect(isLeadDirectoryVisible(true)).toBe(true);
    expect(isLeadDirectoryVisible(false)).toBe(false);
  });
});

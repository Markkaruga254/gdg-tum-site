import { describe, expect, it } from "vitest";
import { canManageWriteup } from "../permissions";

describe("canManageWriteup", () => {
  const ownCloudWriteup = { authorId: "lead-1", trackId: "cloud" };

  it("allows a lead to manage their own writeup while they lead its track", () => {
    expect(canManageWriteup("lead", "lead-1", "cloud", ownCloudWriteup)).toBe(true);
  });

  it("allows another lead on the same track to manage the writeup", () => {
    expect(canManageWriteup("lead", "lead-2", "cloud", ownCloudWriteup)).toBe(true);
  });

  it("denies a former track lead from publishing or editing their old writeup", () => {
    expect(canManageWriteup("lead", "lead-1", "web", ownCloudWriteup)).toBe(false);
  });

  it("allows admins to manage writeups across tracks", () => {
    expect(canManageWriteup("admin", "admin-1", "web", ownCloudWriteup)).toBe(true);
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {} }));

import { cloudThumb } from "../gallery";

describe("cloudThumb", () => {
  it("inserts width and quality params into Cloudinary URLs", () => {
    expect(
      cloudThumb("https://res.cloudinary.com/demo/upload/v1234567890/folder/image.jpg", 600),
    ).toBe("https://res.cloudinary.com/demo/upload/w_600,q_auto,f_auto/v1234567890/folder/image.jpg");
  });

  it("uses the requested width", () => {
    expect(
      cloudThumb("https://res.cloudinary.com/demo/upload/v1234567890/folder/image.jpg", 800),
    ).toBe("https://res.cloudinary.com/demo/upload/w_800,q_auto,f_auto/v1234567890/folder/image.jpg");
  });

  it("leaves non-Cloudinary URLs unchanged", () => {
    expect(cloudThumb("https://example.invalid/image.jpg", 600)).toBe("https://example.invalid/image.jpg");
  });
});

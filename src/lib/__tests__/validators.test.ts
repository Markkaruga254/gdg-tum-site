import { describe, expect, it } from "vitest";
import { validateEvent, validateWriteup, validateLinks, trackColor, validatePartner, type PartnerType } from "../validators";

describe("validateEvent", () => {
  it("accepts a complete member event", () => {
    expect(
      validateEvent(
        { title: "Talk", date: "2026-11-05T10:00", venue: "Hall", status: "upcoming", attendance: "", trackId: "cloud" },
        "member",
      ),
    ).toEqual({});
  });

  it("accepts a complete admin event", () => {
    expect(
      validateEvent(
        { title: "Talk", date: "2026-11-05T10:00", venue: "Hall", status: "upcoming", attendance: "", trackId: "web" },
        "admin",
      ),
    ).toEqual({});
  });

  it("rejects missing title, date, venue", () => {
    expect(
      validateEvent({ title: "", date: "", venue: "", status: "upcoming", attendance: "", trackId: "cloud" }, "member"),
    ).toEqual({
      title: "Title required",
      date: "Date required",
      venue: "Venue required",
    });
  });

  it("requires trackId for admin but not member", () => {
    const member = validateEvent(
      { title: "T", date: "d", venue: "v", status: "upcoming", attendance: "", trackId: "" },
      "member",
    );
    expect(member.trackId).toBeUndefined();

    const admin = validateEvent(
      { title: "T", date: "d", venue: "v", status: "upcoming", attendance: "", trackId: "" },
      "admin",
    );
    expect(admin.trackId).toBe("Track required");
  });

  it("trims whitespace-only title", () => {
    expect(
      validateEvent({ title: "   ", date: "d", venue: "v", status: "upcoming", attendance: "", trackId: "cloud" }, "member"),
    ).toEqual({ title: "Title required" });
  });
});

describe("validateWriteup", () => {
  const base: Parameters<typeof validateWriteup>[0] = {
    eventId: "ev-1",
    title: "T",
    summary: "S",
    body: "B",
    attendance: "",
    links: [],
  };

  it("accepts a draft with no body", () => {
    expect(validateWriteup({ ...base, title: "T" }, false)).toEqual({});
  });

  it("requires body to publish", () => {
    expect(validateWriteup({ ...base, body: "" }, true)).toEqual({ body: "Body required to publish" });
  });

  it("rejects negative attendance", () => {
    expect(validateWriteup({ ...base, attendance: "-3" }, false)).toEqual({
      attendance: "Attendance must be non-negative",
    });
  });

  it("rejects non-http links", () => {
    expect(
      validateWriteup({ ...base, links: [{ title: "x", url: "ftp://example.invalid" }] }, false),
    ).toEqual({ links: "Links must start with http(s)://" });
  });

  it("allows empty url links and https", () => {
    expect(
      validateWriteup(
        { ...base, links: [{ title: "", url: "" }, { title: "x", url: "https://example.invalid" }] },
        false,
      ),
    ).toEqual({});
  });

  it("requires eventId and title", () => {
    expect(validateWriteup({ ...base, eventId: "", title: "" }, false)).toEqual({
      eventId: "Event required",
      title: "Title required",
    });
  });
});

describe("validateLinks", () => {
  it("returns null for valid links", () => {
    expect(validateLinks([{ title: "a", url: "https://example.invalid" }])).toBeNull();
    expect(validateLinks([])).toBeNull();
  });

  it("returns an error message for invalid links", () => {
    expect(validateLinks([{ title: "a", url: "javascript:alert(1)" }])).toBe(
      "Links must start with http(s)://",
    );
  });
});

describe("trackColor", () => {
  const tracks = [
    { slug: "cloud", color: "blue" },
    { slug: "web", color: "green" },
  ];

  it("returns the track color for a known slug", () => {
    expect(trackColor("cloud", tracks)).toBe("blue");
    expect(trackColor("web", tracks)).toBe("green");
  });

  it("defaults to blue for an unknown slug", () => {
    expect(trackColor("women-in-tech", tracks)).toBe("blue");
    expect(trackColor("nope", tracks)).toBe("blue");
  });
});

describe("validatePartner", () => {
  const base: Parameters<typeof validatePartner>[0] = {
    name: "Test Partner",
    link: "https://example.invalid",
    type: "company",
    order: "1",
    active: true,
  };

  it("accepts a complete partner", () => {
    expect(validatePartner({ ...base })).toEqual({});
  });

  it("rejects missing name", () => {
    expect(validatePartner({ ...base, name: "" })).toEqual({ name: "Name required" });
  });

  it("rejects name over 80 chars", () => {
    expect(validatePartner({ ...base, name: "x".repeat(81) })).toEqual({
      name: "Name too long (max 80)",
    });
  });

  it("rejects non-http link", () => {
    expect(validatePartner({ ...base, link: "ftp://example.invalid" })).toEqual({
      link: "Link must start with http(s)://",
    });
  });

  it("rejects invalid type", () => {
    expect(validatePartner({ ...base, type: "bogus" as PartnerType })).toEqual({
      type: "Type required",
    });
  });

  it("rejects negative order", () => {
    expect(validatePartner({ ...base, order: "-3" })).toEqual({
      order: "Order must be a non-negative integer",
    });
  });

  it("rejects non-integer order", () => {
    expect(validatePartner({ ...base, order: "1.5" })).toEqual({
      order: "Order must be a non-negative integer",
    });
  });

  it("accepts zero order", () => {
    expect(validatePartner({ ...base, order: "0" })).toEqual({});
  });

  it("trims whitespace-only name", () => {
    expect(validatePartner({ ...base, name: "   " })).toEqual({ name: "Name required" });
  });
});

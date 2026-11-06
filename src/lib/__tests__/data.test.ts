import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  collection: mocks.collection,
  query: mocks.query,
  where: mocks.where,
  orderBy: mocks.orderBy,
  limit: mocks.limit,
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

import {
  mapDocs,
  getDocById,
  getCollection,
  getEvents,
  getEventById,
  getWriteups,
  getWriteupById,
  getTracks,
  getTrackBySlug,
  getUsers,
  getUserById,
  getPartners,
  getMediaByWriteup,
  getPosts,
  getTicker,
  type TrackSlug,
} from "../data";
import type { QueryConstraint } from "firebase/firestore";

function makeDoc<T>(id: string, data: T): { id: string; data(): T; exists(): boolean } {
  return { id, data: () => data, exists: () => true };
}

function makeMissingDoc(): { id: string; data(): never; exists(): boolean } {
  return { id: "missing", data: () => ({} as never), exists: () => false };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mapDocs", () => {
  it("maps docs to objects with id spread", () => {
    const docs = [makeDoc("doc1", { name: "One" }), makeDoc("doc2", { name: "Two" })];
    const result = mapDocs<{ name: string }>(docs);
    expect(result).toEqual([
      { id: "doc1", name: "One" },
      { id: "doc2", name: "Two" },
    ]);
  });

  it("returns empty array for no docs", () => {
    expect(mapDocs<{ name: string }>([])).toEqual([]);
  });
});

describe("getDocById", () => {
  it("returns mapped doc when document exists", async () => {
    mocks.doc.mockReturnValue({});
    mocks.getDoc.mockResolvedValue(makeDoc("ev-1", { title: "Talk" }));
    const result = await getDocById<{ title: string }>("events", "ev-1");
    expect(mocks.doc).toHaveBeenCalledWith(expect.anything(), "events", "ev-1");
    expect(mocks.getDoc).toHaveBeenCalledWith({});
    expect(result).toEqual({ id: "ev-1", title: "Talk" });
  });

  it("returns null when document does not exist", async () => {
    mocks.doc.mockReturnValue({});
    mocks.getDoc.mockResolvedValue(makeMissingDoc());
    const result = await getDocById<{ title: string }>("events", "missing");
    expect(result).toBeNull();
  });
});

describe("getCollection", () => {
  it("queries a collection with no constraints", async () => {
    mocks.collection.mockReturnValue({});
    mocks.query.mockReturnValue({});
    mocks.getDocs.mockResolvedValue({ docs: [makeDoc("a", { x: 1 }), makeDoc("b", { x: 2 })] });
    const result = await getCollection<{ x: number }>("test");
    expect(mocks.collection).toHaveBeenCalledWith(expect.anything(), "test");
    expect(mocks.query).toHaveBeenCalledWith({});
    expect(mocks.getDocs).toHaveBeenCalledWith({});
    expect(result).toEqual([{ id: "a", x: 1 }, { id: "b", x: 2 }]);
  });

  it("passes constraints to query", async () => {
    mocks.collection.mockReturnValue({});
    mocks.query.mockReturnValue({});
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getCollection<{ x: number }>("test", [mocks.where as unknown as QueryConstraint]);
    expect(mocks.query).toHaveBeenCalledWith({}, mocks.where);
  });
});

describe("getEvents", () => {
  it("queries events ordered by date desc by default", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getEvents();
    expect(mocks.orderBy).toHaveBeenCalledWith("date", "desc");
  });

  it("queries events ordered by date asc when orderAsc is true", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getEvents({ orderAsc: true });
    expect(mocks.orderBy).toHaveBeenCalledWith("date", "asc");
  });

  it("adds trackId filter when provided", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getEvents({ trackId: "cloud" });
    expect(mocks.where).toHaveBeenCalledWith("trackId", "==", "cloud");
  });

  it("adds status filter when provided", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getEvents({ status: "past" });
    expect(mocks.where).toHaveBeenCalledWith("status", "==", "past");
  });
});

describe("getEventById", () => {
  it("delegates to getDocById for events", async () => {
    mocks.getDoc.mockResolvedValue(makeDoc("ev-1", { title: "Talk" }));
    const result = await getEventById("ev-1");
    expect(mocks.doc).toHaveBeenCalledWith(expect.anything(), "events", "ev-1");
    expect(result).toEqual({ id: "ev-1", title: "Talk" });
  });

  it("returns null for missing event", async () => {
    mocks.getDoc.mockResolvedValue(makeMissingDoc());
    const result = await getEventById("missing");
    expect(result).toBeNull();
  });
});

describe("getWriteups", () => {
  it("does not order draft-inclusive writeup queries by publishedAt", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getWriteups();
    expect(mocks.orderBy).not.toHaveBeenCalled();
  });

  it("orders published writeups by publishedAt descending", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getWriteups({ status: "published" });
    expect(mocks.orderBy).toHaveBeenCalledWith("publishedAt", "desc");
  });

  it("adds status filter", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getWriteups({ status: "published" });
    expect(mocks.where).toHaveBeenCalledWith("status", "==", "published");
  });

  it("adds trackId filter", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getWriteups({ trackId: "web" });
    expect(mocks.where).toHaveBeenCalledWith("trackId", "==", "web");
  });

  it("adds authorId filter", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getWriteups({ authorId: "u-1" });
    expect(mocks.where).toHaveBeenCalledWith("authorId", "==", "u-1");
  });

  it("adds limit when provided", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getWriteups({ limitCount: 3 });
    expect(mocks.limit).toHaveBeenCalledWith(3);
  });
});

describe("getWriteupById", () => {
  it("delegates to getDocById for writeups", async () => {
    mocks.getDoc.mockResolvedValue(makeDoc("w-1", { title: "Draft" }));
    const result = await getWriteupById("w-1");
    expect(mocks.doc).toHaveBeenCalledWith(expect.anything(), "writeups", "w-1");
    expect(result).toEqual({ id: "w-1", title: "Draft" });
  });
});

describe("getTracks", () => {
  it("queries all tracks", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [makeDoc("t-1", { slug: "cloud", name: "Cloud" })] });
    const result = await getTracks();
    expect(mocks.collection).toHaveBeenCalledWith(expect.anything(), "tracks");
    expect(result).toEqual([{ id: "t-1", slug: "cloud", name: "Cloud" }]);
  });
});

describe("getTrackBySlug", () => {
  it("queries tracks by slug", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [makeDoc("t-1", { slug: "cloud", name: "Cloud" })] });
    const result = await getTrackBySlug("cloud");
    expect(mocks.where).toHaveBeenCalledWith("slug", "==", "cloud");
    expect(result).toEqual({ id: "t-1", slug: "cloud", name: "Cloud" });
  });

  it("returns null when no matching slug", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    const result = await getTrackBySlug("nonexistent" as TrackSlug);
    expect(result).toBeNull();
  });
});

describe("getUsers", () => {
  it("queries all users by default", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getUsers();
    expect(mocks.collection).toHaveBeenCalledWith(expect.anything(), "users");
    expect(mocks.where).not.toHaveBeenCalled();
  });

  it("filters by role when provided", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getUsers("lead");
    expect(mocks.where).toHaveBeenCalledWith("role", "==", "lead");
  });
});

describe("getUserById", () => {
  it("delegates to getDocById for users", async () => {
    mocks.getDoc.mockResolvedValue(makeDoc("u-1", { name: "Alice", role: "lead" }));
    const result = await getUserById("u-1");
    expect(mocks.doc).toHaveBeenCalledWith(expect.anything(), "users", "u-1");
    expect(result).toEqual({ id: "u-1", name: "Alice", role: "lead" });
  });
});

describe("getPartners", () => {
  it("queries active partners ordered by order asc", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getPartners();
    expect(mocks.collection).toHaveBeenCalledWith(expect.anything(), "partners");
    expect(mocks.where).toHaveBeenCalledWith("active", "==", true);
    expect(mocks.orderBy).toHaveBeenCalledWith("order", "asc");
  });
});

describe("getMediaByWriteup", () => {
  it("queries media by writeupId", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getMediaByWriteup("w-1");
    expect(mocks.where).toHaveBeenCalledWith("writeupId", "==", "w-1");
  });
});

describe("getPosts", () => {
  it("queries all posts", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getPosts();
    expect(mocks.collection).toHaveBeenCalledWith(expect.anything(), "posts");
  });
});

describe("getTicker", () => {
  it("queries all ticker entries", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    await getTicker();
    expect(mocks.collection).toHaveBeenCalledWith(expect.anything(), "ticker");
  });
});

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
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

import type { QueryConstraint } from "firebase/firestore";
import { useCollection } from "../data";

function makeDoc(id: string, data: unknown): { id: string; data(): unknown; exists(): boolean } {
  return { id, data: () => data, exists: () => true };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCollection", () => {
  it("starts in loading state and resolves with data", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [makeDoc("a", { x: 1 })] });
    const { result } = renderHook(() => useCollection<{ x: number }>("test"));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([{ id: "a", x: 1 }]);
    expect(result.current.error).toBeNull();
  });

  it("sets error when query fails", async () => {
    mocks.getDocs.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useCollection<{ x: number }>("test"));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("boom");
  });

  it("does not load when enabled is false", async () => {
    mocks.getDocs.mockResolvedValue({ docs: [] });
    const { result } = renderHook(() => useCollection<{ x: number }>("test", [], { enabled: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(mocks.getDocs).not.toHaveBeenCalled();
  });

  it("passes constraints to query", async () => {
    mocks.collection.mockReturnValue({});
    mocks.query.mockReturnValue({});
    mocks.getDocs.mockResolvedValue({ docs: [] });
    const { result } = renderHook(() => useCollection<{ x: number }>("test", [vi.fn() as unknown as QueryConstraint]));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mocks.query).toHaveBeenCalledWith({}, expect.any(Function));
  });
});

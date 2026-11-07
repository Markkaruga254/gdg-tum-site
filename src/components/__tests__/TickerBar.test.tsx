import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock("firebase/firestore", () => mocks);
vi.mock("@/lib/firebase", () => ({ db: {} }));

import TickerBar from "../TickerBar";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TickerBar", () => {
  it("stays hidden when there is no active ticker entry", () => {
    mocks.onSnapshot.mockImplementation((_query, onNext) => {
      onNext({ empty: true, docs: [] });
      return vi.fn();
    });

    render(<TickerBar />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the active ticker message", () => {
    mocks.onSnapshot.mockImplementation((_query, onNext) => {
      onNext({ empty: false, docs: [{ data: () => ({ message: "Cloud lab is live" }) }] });
      return vi.fn();
    });

    render(<TickerBar />);

    expect(screen.getByRole("status")).toHaveTextContent("Live now");
    expect(screen.getByRole("status")).toHaveTextContent("Cloud lab is live");
  });
});

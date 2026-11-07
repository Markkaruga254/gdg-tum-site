import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BlogPage from "./page";

const dataMocks = vi.hoisted(() => ({
  getPosts: vi.fn(),
}));

vi.mock("@/lib/data", () => dataMocks);
vi.mock("@/components/Nav", () => ({ default: () => <nav aria-label="Main navigation">Navigation</nav> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer>Footer</footer> }));
vi.mock("@/components/Tag", () => ({
  default: ({ label }: { label: string }) => <span>{label}</span>,
}));

function post(id: string, tags: string[], hidden = false) {
  return {
    id,
    title: `Article ${id}`,
    summary: `Summary ${id}`,
    sourceName: "Example source",
    sourceUrl: `https://example.com/${id}`,
    tags,
    fetchedAt: { toDate: () => new Date("2026-11-01T00:00:00Z") },
    hidden,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  dataMocks.getPosts.mockResolvedValue([]);
});

afterEach(cleanup);

describe("Blog page", () => {
  it("shows a loading state before articles resolve", async () => {
    dataMocks.getPosts.mockReturnValue(new Promise(() => {}));
    render(<BlogPage />);
    expect(screen.getByText("Loading articles…")).toBeInTheDocument();
  });

  it("renders visible articles and omits hidden posts", async () => {
    dataMocks.getPosts.mockResolvedValue([
      post("cloud", ["Cloud"]),
      post("hidden", ["Cloud"], true),
    ]);
    render(<BlogPage />);

    expect(await screen.findByText("Article cloud")).toBeInTheDocument();
    expect(screen.queryByText("Article hidden")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source ↗" })).toHaveAttribute(
      "href",
      "https://example.com/cloud",
    );
  });

  it("filters by topic and resets the visible count", async () => {
    dataMocks.getPosts.mockResolvedValue([
      post("cloud", ["Cloud"]),
      post("mobile", ["Mobile"]),
    ]);
    render(<BlogPage />);

    await screen.findByText("Article cloud");
    fireEvent.click(screen.getByRole("button", { name: "Mobile" }));

    expect(screen.getByText("Article mobile")).toBeInTheDocument();
    expect(screen.queryByText("Article cloud")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mobile" })).toHaveAttribute("aria-pressed", "true");
  });

  it("reveals the next batch when Load more is selected", async () => {
    dataMocks.getPosts.mockResolvedValue(
      Array.from({ length: 8 }, (_, index) => post(String(index + 1), ["Cloud"])),
    );
    render(<BlogPage />);

    await screen.findByText("Article 1");
    expect(screen.queryByText("Article 7")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more ↓" }));

    expect(screen.getByText("Article 7")).toBeInTheDocument();
    expect(screen.getByText("Article 8")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Load more ↓" })).not.toBeInTheDocument());
  });

  it("shows a useful empty state when there are no published articles", async () => {
    render(<BlogPage />);
    expect(await screen.findByText("No articles have been published yet.")).toBeInTheDocument();
  });

  it("shows a recoverable error when loading fails", async () => {
    dataMocks.getPosts.mockRejectedValue(new Error("Firestore unavailable"));
    render(<BlogPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The tech blog is temporarily unavailable.",
    );
  });
});

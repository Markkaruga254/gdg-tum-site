import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import Home from "./page";

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  getDocs: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(() => () => {}),
}));

vi.mock("firebase/firestore", () => firestoreMocks);
vi.mock("firebase/auth", () => ({
  auth: {},
  onAuthStateChanged: authMocks.onAuthStateChanged,
}));
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({
  auth: {},
  signInGoogle: vi.fn(),
  signOut: vi.fn(),
}));

const dataMocks = vi.hoisted(() => ({
  getEvents: vi.fn(),
  getWriteups: vi.fn(),
  getTracks: vi.fn(),
  getUsers: vi.fn(),
  getPosts: vi.fn(),
  getPartners: vi.fn(),
}));
const galleryMocks = vi.hoisted(() => ({
  getGalleryPage: vi.fn(),
}));

vi.mock("@/lib/data", () => dataMocks);
vi.mock("@/lib/gallery", () => galleryMocks);

vi.mock("@/lib/tracks", () => ({
  TRACKS: [],
  TRACK_BG_COLORS: {},
  trackColor: () => "ink",
  trackTagColor: () => "ink",
}));

beforeEach(() => {
  vi.clearAllMocks();
  dataMocks.getEvents.mockResolvedValue([]);
  dataMocks.getWriteups.mockResolvedValue([]);
  dataMocks.getTracks.mockResolvedValue([]);
  dataMocks.getUsers.mockResolvedValue([]);
  dataMocks.getPosts.mockResolvedValue([]);
  dataMocks.getPartners.mockResolvedValue([]);
  authMocks.onAuthStateChanged.mockImplementation(() => () => {});
});

afterEach(() => {
  cleanup();
});

describe("Home page moments", () => {
  it("renders a loading block while photos are loading without reading photos[0]", async () => {
    galleryMocks.getGalleryPage.mockImplementation(() => new Promise(() => {}));
    render(<Home />);
    await screen.findByText("Loading photos…");
    expect(screen.queryByText("Photos from our events will appear here.")).not.toBeInTheDocument();
  });

  it("renders the empty message when no photos exist", async () => {
    galleryMocks.getGalleryPage.mockResolvedValue({ photos: [], nextCursor: null });
    render(<Home />);
    await screen.findByText("Photos from our events will appear here.");
    expect(screen.queryByText("Loading photos…")).not.toBeInTheDocument();
  });

  it("shows only active partners in order, with only their types and the CTA last", async () => {
    dataMocks.getPartners.mockResolvedValue([
      { id: "partner-b", name: "Beta Community", link: "https://beta.example", type: "community", order: 2, active: true },
      { id: "partner-hidden", name: "Inactive Partner", link: "https://hidden.example", type: "company", order: 0, active: false },
      { id: "partner-a", name: "Alpha University", link: "https://alpha.example", type: "university", order: 1, active: true },
    ]);
    render(<Home />);

    await screen.findByText("Alpha University");
    const cta = screen.getByText("Your organisation here ↗");
    const partnerSection = document.querySelector("#partners");
    const partnerLinks = Array.from(partnerSection?.querySelectorAll('a[href^="https://"]') ?? []);

    expect(partnerLinks.map((link) => link.getAttribute("href"))).toEqual([
      "https://alpha.example",
      "https://beta.example",
    ]);
    expect(screen.queryByText("Inactive Partner")).not.toBeInTheDocument();
    expect(screen.getByText("University")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.queryByText("Company")).not.toBeInTheDocument();
    expect(cta.closest(".grid")?.lastElementChild).toBe(cta);
  });
});

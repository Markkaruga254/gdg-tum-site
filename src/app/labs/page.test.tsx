import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LabsPage from "./page";

vi.mock("@/components/Nav", () => ({ default: () => <nav aria-label="Main navigation">Navigation</nav> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer>Footer</footer> }));

afterEach(cleanup);

describe("Labs page", () => {
  it("communicates that labs are planned rather than open", () => {
    render(<LabsPage />);

    expect(screen.getByRole("heading", { name: "Labs" })).toBeInTheDocument();
    expect(screen.getByText("Soon")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Planned labs" })).toBeInTheDocument();
    expect(screen.getAllByText("Planned")).toHaveLength(3);
    expect(screen.getAllByText("Details soon")).toHaveLength(3);
  });

  it("keeps the announcement form visibly disabled until it is implemented", () => {
    render(<LabsPage />);

    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Coming soon" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Get told when labs open" })).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Frame from "../Frame";
import Footer from "../Footer";
import SectionHeader from "../SectionHeader";
import StatBlock from "../StatBlock";
import FormField from "../form/FormField";

describe("shared shell primitives", () => {
  it("provides the centered white 1280px frame with a 3px ink border", () => {
    const { container } = render(<Frame><p>Page content</p></Frame>);
    expect(container.firstElementChild).toHaveClass("mx-auto", "max-w-[1280px]", "border-[3px]", "border-ink", "bg-white");
  });

  it("renders the shared footer with an optional top divider", () => {
    const { rerender } = render(<Footer />);
    expect(screen.getByRole("contentinfo")).toHaveClass("border-t-[3px]", "border-ink");
    rerender(<Footer borderTop={false} />);
    expect(screen.getByRole("contentinfo")).not.toHaveClass("border-t-[3px]");
    expect(screen.getByText("© 2026 GDG on Campus TUM")).toBeInTheDocument();
  });

  it("renders the compact uppercase section label", () => {
    render(<SectionHeader>Latest writeups</SectionHeader>);
    expect(screen.getByText("Latest writeups")).toHaveClass("text-[12px]", "font-bold", "uppercase", "tracking-[.5px]");
  });

  it("renders a display-number stat and its label", () => {
    render(<StatBlock value={12} label="Events held" />);
    expect(screen.getByText("12")).toHaveClass("font-display");
    expect(screen.getByText("Events held")).toHaveClass("text-[10px]", "font-bold", "uppercase");
  });

  it("associates form labels with controls and exposes field errors", () => {
    render(
      <FormField label="Email" id="email" error="Email is required">
        <input id="email" />
      </FormField>,
    );
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });
});

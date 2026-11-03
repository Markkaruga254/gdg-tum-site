import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Tag from "../Tag";

describe("Tag", () => {
  it("renders the label", () => {
    render(<Tag label="Cloud" />);
    expect(screen.getByText("Cloud")).toBeInTheDocument();
  });

  it("applies the default ink color class", () => {
    render(<Tag label="Cloud" />);
    const el = screen.getByText("Cloud");
    expect(el).toHaveClass("bg-ink");
    expect(el).toHaveClass("text-white");
  });

  it("applies the requested color class", () => {
    render(<Tag label="Cloud" color="blue" />);
    const el = screen.getByText("Cloud");
    expect(el).toHaveClass("bg-blue");
    expect(el).toHaveClass("text-white");
  });

  it("applies the red color class", () => {
    render(<Tag label="Cybersecurity" color="red" />);
    const el = screen.getByText("Cybersecurity");
    expect(el).toHaveClass("bg-red");
    expect(el).toHaveClass("text-ink");
  });
});

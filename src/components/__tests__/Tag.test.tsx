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

  it("uses the specified 3px ink border for the Women in Tech tag", () => {
    render(<Tag label="Women in Tech" color="yellow" />);
    expect(screen.getByText("Women in Tech")).toHaveClass("border-[3px]", "border-ink");
  });

  it("supports a white company tag with an explicit border", () => {
    render(<Tag label="Company" color="white" bordered />);
    expect(screen.getByText("Company")).toHaveClass("bg-white", "border-[3px]");
  });
});

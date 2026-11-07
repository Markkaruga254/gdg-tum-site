import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "../Button";

describe("Button", () => {
  it("renders the outline and yellow variants", () => {
    const { rerender } = render(<Button variant="outline">Read more</Button>);
    expect(screen.getByRole("button", { name: "Read more" })).toHaveClass("bg-white");
    rerender(<Button variant="yellow">Join</Button>);
    expect(screen.getByRole("button", { name: "Join" })).toHaveClass("bg-yellow");
  });

  it("renders the disabled variant as a disabled control", () => {
    render(<Button variant="disabled">Coming soon</Button>);
    expect(screen.getByRole("button", { name: "Coming soon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Coming soon" })).toHaveClass("opacity-60");
  });
});

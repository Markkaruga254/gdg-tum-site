import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NumberedRow from "../NumberedRow";

describe("NumberedRow", () => {
  it("renders its number, content, metadata and trailing content", () => {
    render(
      <NumberedRow n="01" meta="12 Oct · Cloud" trailing={<a href="/writeup?id=w-1">Read ↗</a>}>
        <strong>Writeup title</strong>
      </NumberedRow>,
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Writeup title")).toBeInTheDocument();
    expect(screen.getByText("12 Oct · Cloud")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read ↗" })).toHaveAttribute("href", "/writeup?id=w-1");
  });
});

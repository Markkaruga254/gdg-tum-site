import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ContentCard from "../ContentCard";
import PartnerCell from "../PartnerCell";
import TrackBlock from "../TrackBlock";

describe("shared content components", () => {
  it("renders content in a bordered semantic card", () => {
    render(<ContentCard>Card content</ContentCard>);
    expect(screen.getByRole("article")).toHaveTextContent("Card content");
  });

  it("renders partner name and its type tag as the linked cell content", () => {
    render(<PartnerCell name="TUM" link="https://example.invalid" type="university" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://example.invalid");
    expect(screen.getByText("TUM")).toBeInTheDocument();
    expect(screen.getByText("University")).toBeInTheDocument();
  });

  it("renders resolved lead names and a real empty lead state", () => {
    const { rerender } = render(
      <TrackBlock number={1} name="Cloud" slug="cloud" description="Cloud learning." leadNames={["Cloud Lead"]} />,
    );
    expect(screen.getByText("Lead: Cloud Lead")).toBeInTheDocument();
    rerender(<TrackBlock number={1} name="Cloud" slug="cloud" description="Cloud learning." />);
    expect(screen.getByText("Lead: To be announced")).toBeInTheDocument();
    expect(screen.queryByText(/\[Lead name\]/)).not.toBeInTheDocument();
  });
});

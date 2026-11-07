import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ContentCard from "../ContentCard";
import PartnerCell from "../PartnerCell";
import TrackBlock from "../TrackBlock";
import LeadCard from "../LeadCard";
import FilterBar from "../FilterBar";

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
    expect(screen.queryByText(/^Lead:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[Lead name\]/)).not.toBeInTheDocument();
  });
  it("renders track-scoped lead image fallback without covering the image", () => {
    const { container } = render(
      <LeadCard name="Ada Lovelace" track="cloud" bio="Cloud lead." photoUrl="/missing.jpg" href="/lead?id=ada" />,
    );
    const image = screen.getByRole("img", { name: "Ada Lovelace" });
    const imageContainer = image.parentElement as HTMLElement;

    fireEvent.error(image);

    expect(imageContainer.style.backgroundColor).toBe("rgb(25, 103, 210)");
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(container.querySelector(".absolute")).not.toBeInTheDocument();
  });

  it("marks the selected filter with aria-pressed and reports selection changes", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={[{ label: "All", value: "all" }, { label: "Cloud", value: "cloud" }]}
        value="all"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveClass("bg-yellow");
    expect(screen.getByRole("button", { name: "Cloud" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Cloud" }));
    expect(onChange).toHaveBeenCalledWith("cloud");
  });

});

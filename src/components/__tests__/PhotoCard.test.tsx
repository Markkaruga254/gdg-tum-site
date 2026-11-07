import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PhotoCard from "../PhotoCard";

describe("PhotoCard", () => {
  it("does not render a caption layer over a successfully loaded photo", () => {
    const { container } = render(
      <PhotoCard url="/photo.jpg" caption="Cloud workshop" altText="Students at a workshop" trackId="cloud" writeupId="w-1" />,
    );
    expect(screen.getByRole("img", { name: "Students at a workshop" })).toBeInTheDocument();
    expect(container.querySelector(".absolute")).not.toBeInTheDocument();
    expect(screen.queryByText("Cloud workshop", { selector: '[role="img"]' })).not.toBeInTheDocument();
  });

  it("shows the track-color fallback only after an image fails", () => {
    const { container } = render(
      <PhotoCard url="/missing.jpg" caption="Cloud workshop" altText="Workshop" trackId="cloud" writeupId="w-1" />,
    );
    const image = screen.getByRole("img", { name: "Workshop" });
    expect(container.querySelector('[style*="background-color"]')).not.toBeInTheDocument();
    const imageContainer = image.parentElement as HTMLElement;
    fireEvent.error(image);
    expect(screen.getByRole("img", { name: "Workshop" })).toHaveTextContent("Cloud workshop");
    expect(imageContainer.style.backgroundColor).toBe("rgb(25, 103, 210)");
  });
});

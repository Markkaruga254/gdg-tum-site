import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FilterBar from "../FilterBar";
import EmptyState from "../EmptyState";
import LoadingBlock from "../LoadingBlock";
import ErrorBlock from "../ErrorBlock";

describe("shared state components", () => {
  it("exposes active filters with aria-pressed and reports selection", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={[{ label: "All", value: "all" }, { label: "Cloud", value: "cloud" }]}
        value="all"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Cloud" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Cloud" }));
    expect(onChange).toHaveBeenCalledWith("cloud");
  });

  it("renders an announced empty state", () => {
    render(<EmptyState>Nothing here yet.</EmptyState>);
    expect(screen.getByRole("status")).toHaveTextContent("Nothing here yet.");
  });

  it("renders an announced loading state", () => {
    render(<LoadingBlock label="Loading events…" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveTextContent("Loading events…");
  });

  it("renders an error and invokes retry when requested", () => {
    const onRetry = vi.fn();
    render(<ErrorBlock message="Could not load events." onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load events.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

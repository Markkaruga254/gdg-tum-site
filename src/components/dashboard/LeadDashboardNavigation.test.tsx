import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";

vi.mock("next/link", () => ({
  default: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props} />,
}));
import LeadDashboardNavigation from "./LeadDashboardNavigation";

describe("lead dashboard navigation", () => {
  it("shows only track workspace sections to leads", () => {
    render(
      <LeadDashboardNavigation
        role="lead"
        track="cloud"
        tab="Overview"
        onTabChange={vi.fn()}
      />,
    );

    const sidebar = within(screen.getByTestId("dashboard-sidebar"));
    for (const label of ["Overview", "New writeup", "Events", "My media", "Live ticker", "My profile"]) {
      expect(sidebar.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(sidebar.queryByRole("button", { name: "Gallery manager" })).not.toBeInTheDocument();
    expect(sidebar.queryByRole("button", { name: "Partners" })).not.toBeInTheDocument();
    expect(sidebar.getByRole("link", { name: "My track ↗" })).toHaveAttribute("href", "/track?slug=cloud");
  });

  it("marks the current section and changes sections when selected", () => {
    const onTabChange = vi.fn();
    render(
      <LeadDashboardNavigation
        role="lead"
        track="cloud"
        tab="Track events"
        onTabChange={onTabChange}
      />,
    );

    const sidebar = within(screen.getByTestId("dashboard-sidebar"));
    expect(sidebar.getByRole("button", { name: "Events" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(sidebar.getByRole("button", { name: "My profile" }));
    expect(onTabChange).toHaveBeenCalledWith("My profile");
  });

  it("exposes secondary sections through the mobile More menu", () => {
    const onTabChange = vi.fn();
    render(
      <LeadDashboardNavigation
        role="lead"
        track="cloud"
        tab="Overview"
        onTabChange={onTabChange}
      />,
    );

    const mobileNav = screen.getByRole("navigation", { name: "Mobile dashboard navigation" });
    const moreButton = within(mobileNav).getByRole("button", { name: /More/ });
    expect(moreButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(moreButton);

    const moreMenu = within(screen.getByText("More workspace").parentElement as HTMLElement);
    expect(moreMenu.getByRole("link", { name: "My track ↗" })).toHaveAttribute("href", "/track?slug=cloud");
    fireEvent.click(moreMenu.getByRole("button", { name: "My media" }));
    expect(onTabChange).toHaveBeenCalledWith("Media");
    expect(moreButton).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps chapter-wide sections available only to admins", () => {
    render(
      <LeadDashboardNavigation
        role="admin"
        track=""
        tab="Overview"
        onTabChange={vi.fn()}
      />,
    );

    const sidebar = within(screen.getByTestId("dashboard-sidebar"));
    expect(sidebar.getByRole("button", { name: "Gallery manager" })).toBeInTheDocument();
    expect(sidebar.getByRole("button", { name: "Partners" })).toBeInTheDocument();
    expect(sidebar.queryByRole("link", { name: "My track ↗" })).not.toBeInTheDocument();
  });
});

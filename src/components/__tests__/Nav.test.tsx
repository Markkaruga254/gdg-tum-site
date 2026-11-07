import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";

const navState = vi.hoisted(() => ({
  pathname: "/tracks",
  user: null as null | { displayName: string },
}));

vi.mock("next/link", () => ({
  default: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props} />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: typeof navState.user) => void) => {
    callback(navState.user);
    return vi.fn();
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: {},
  signOut: vi.fn(),
}));

import Nav from "../Nav";

beforeEach(() => {
  navState.pathname = "/tracks";
  navState.user = null;
});

describe("canonical navigation", () => {
  it("renders desktop navigation and the compact expandable mobile menu", () => {
    render(<Nav home />);
    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(navigation).toHaveClass("flex-wrap");
    for (const label of ["Events", "Tracks", "Gallery", "Blog", "Leads", "Labs", "Sign in"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /Join/ })).toBeInTheDocument();

    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const mobileMenu = navigation.querySelector("#mobile-navigation");
    expect(mobileMenu).not.toBeNull();
    const mobileLinks = within(mobileMenu as HTMLElement);
    for (const label of ["Events", "Tracks", "Gallery", "Blog", "Leads", "Labs", "Sign in"]) {
      expect(mobileLinks.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("keeps the full navigation wrapped on non-home phone pages", () => {
    render(<Nav />);
    expect(screen.queryByRole("button", { name: "Menu" })).not.toBeInTheDocument();
    for (const label of ["Events", "Tracks", "Gallery", "Blog", "Leads", "Labs", "Sign in"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Join a track ↗" })).toBeInTheDocument();
  });

  it("marks the current route yellow and adds the descriptor only on home", () => {
    const { rerender } = render(<Nav />);
    expect(screen.getByRole("link", { name: "Tracks" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Tracks" })).toHaveClass("bg-yellow");
    expect(screen.queryByText("Google Developer Group on Campus")).not.toBeInTheDocument();
    navState.pathname = "/";
    rerender(<Nav home />);
    expect(screen.getByText("Google Developer Group on Campus")).toBeInTheDocument();
  });

  it("shows the signed-in name and sign-out control in the account cell", () => {
    navState.user = { displayName: "Ada" };
    render(<Nav />);
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});

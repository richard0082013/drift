import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NavBar } from "@/components/nav-bar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/checkin"
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...props}>{children}</a>
  )
}));

const mockIsLoggedIn = vi.fn<() => Promise<boolean>>();

vi.mock("@/lib/auth/client-auth", () => ({
  isLoggedIn: () => mockIsLoggedIn()
}));

describe("NavBar", () => {
  beforeEach(() => {
    mockIsLoggedIn.mockReset();
  });

  it("renders brand link to home", async () => {
    mockIsLoggedIn.mockResolvedValue(false);
    render(<NavBar />);
    const brands = screen.getAllByText("Drift");
    expect(brands.length).toBeGreaterThan(0);
    expect(brands[0].closest("a")).toHaveAttribute("href", "/");
  });

  it("shows only Check-in when not authenticated", async () => {
    mockIsLoggedIn.mockResolvedValue(false);
    render(<NavBar />);
    await waitFor(() => {
      expect(screen.getAllByText("Check-in").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("Trends")).not.toBeInTheDocument();
    expect(screen.queryByText("Alerts")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Account")).not.toBeInTheDocument();
  });

  it("shows all navigation links when authenticated", async () => {
    mockIsLoggedIn.mockResolvedValue(true);
    render(<NavBar />);
    await waitFor(() => {
      expect(screen.getAllByText("Trends").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("Check-in").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alerts").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Insights").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Account").length).toBeGreaterThan(0);
  });

  it("marks active link with aria-current", async () => {
    mockIsLoggedIn.mockResolvedValue(true);
    render(<NavBar />);
    await waitFor(() => {
      expect(screen.getAllByText("Check-in").length).toBeGreaterThan(0);
    });
    const checkinLinks = screen.getAllByText("Check-in").map((el) => el.closest("a"));
    const activeLink = checkinLinks.find((a) => a?.getAttribute("aria-current") === "page");
    expect(activeLink).toBeTruthy();
  });

  it("toggles mobile menu on button click", async () => {
    mockIsLoggedIn.mockResolvedValue(false);
    render(<NavBar />);
    const menuButton = screen.getByRole("button", { name: "Open menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  });
});

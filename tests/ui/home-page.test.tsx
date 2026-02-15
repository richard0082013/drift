import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("renders the hero heading and tagline", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Drift");
    expect(screen.getByText(/personal stability early-warning system/i)).toBeInTheDocument();
  });

  it("renders Get Started and Learn More links", () => {
    render(<HomePage />);

    const getStarted = screen.getByRole("link", { name: "Get Started" });
    expect(getStarted).toHaveAttribute("href", "/login");

    const learnMore = screen.getByRole("link", { name: "Learn More" });
    expect(learnMore).toHaveAttribute("href", "/privacy");
  });

  it("renders three feature highlight cards", () => {
    render(<HomePage />);

    expect(screen.getByText("10-Second Check-in")).toBeInTheDocument();
    expect(screen.getByText("Visual Trends")).toBeInTheDocument();
    expect(screen.getByText("Smart Alerts")).toBeInTheDocument();
  });

  it("renders the non-medical disclaimer", () => {
    render(<HomePage />);

    expect(screen.getByText(/not a medical tool/i)).toBeInTheDocument();
  });
});

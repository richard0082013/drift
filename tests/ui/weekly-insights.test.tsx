import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WeeklyInsightsPage from "@/app/insights/page";

let mockPathname = "/insights";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

describe("weekly insights page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/insights";
  });

  it("shows login guidance when unauthenticated", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "UNAUTHORIZED" } }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

    render(<WeeklyInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Go to login" })).toHaveAttribute(
      "href",
      "/login?next=%2Finsights"
    );
  });

  it("shows summary and suggestions when data exists", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            summary: "Your energy trend stayed stable this week.",
            suggestions: ["Keep a consistent check-in time.", "Plan one social reset this weekend."]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    render(<WeeklyInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText("Your energy trend stayed stable this week.")).toBeInTheDocument();
      expect(screen.getByText("Keep a consistent check-in time.")).toBeInTheDocument();
      expect(screen.getByText("Plan one social reset this weekend.")).toBeInTheDocument();
    });
  });

  it("shows empty state when api has no insight payload", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

    render(<WeeklyInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText("No weekly insights yet.")).toBeInTheDocument();
    });
  });

  it("shows generic error without internal details", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "db stack trace" } }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      );

    render(<WeeklyInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load weekly insights.")).toBeInTheDocument();
    });
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
  });
});

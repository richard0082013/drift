import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InsightsPage from "@/app/insights/page";

let mockPathname = "/insights";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function setupFetchMock(options?: {
  sessionStatus?: number;
  insightsStatus?: number;
  insightsPayload?: unknown;
}) {
  const {
    sessionStatus = 200,
    insightsStatus = 200,
    insightsPayload = {
      weekStart: "2026-02-08",
      weekEnd: "2026-02-14",
      days: 7,
      summary: {
        checkinCount: 3,
        alertCount: 1,
        averages: {
          energy: 3.2,
          stress: 3.1,
          social: 2.8,
          driftIndex: 0.6
        },
        driftLevel: "moderate",
        hasEnoughData: true
      },
      highlights: ["3/7 check-ins completed in this window."],
      suggestions: ["Keep one stable routine for the next two days."]
    }
  } = options ?? {};

  return vi.spyOn(global, "fetch").mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    const method = (init?.method ?? "GET").toUpperCase();

    if (url === "/api/auth/session") {
      return jsonResponse({ ok: sessionStatus === 200 }, sessionStatus);
    }

    if (url.startsWith("/api/insights/weekly") && method === "GET") {
      return jsonResponse(insightsPayload, insightsStatus);
    }

    return jsonResponse({ error: "unexpected request" }, 500);
  });
}

describe("weekly insights page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPathname = "/insights";
  });

  it("shows login guidance when unauthenticated", async () => {
    setupFetchMock({ sessionStatus: 401 });

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText("Please log in to continue.")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Go to login" })).toHaveAttribute(
      "href",
      "/login?next=%2Finsights"
    );
  });

  it("loads weekly insights from real contract", async () => {
    setupFetchMock();

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Window:/)).toBeInTheDocument();
      expect(screen.getByText(/2026-02-08/)).toBeInTheDocument();
      expect(screen.getByText(/Drift: moderate/)).toBeInTheDocument();
      expect(screen.getByText(/3\/7 check-ins completed/)).toBeInTheDocument();
    });
  });

  it("switches days range and requests weekly endpoint", async () => {
    const fetchSpy = setupFetchMock();

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "true");
    });

    fireEvent.click(screen.getByRole("button", { name: "14 days" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "14 days" })).toHaveAttribute("aria-pressed", "true");
    });

    expect(
      fetchSpy.mock.calls.some(
        ([url]) => typeof url === "string" && url.includes("/api/insights/weekly?days=14")
      )
    ).toBe(true);
  });

  it("shows clear error state on api failure", async () => {
    setupFetchMock({ insightsStatus: 500, insightsPayload: { error: "bad" } });

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load weekly insights.")).toBeInTheDocument();
    });
  });

  it("shows empty-state hint when data is insufficient", async () => {
    setupFetchMock({
      insightsPayload: {
        weekStart: "2026-02-08",
        weekEnd: "2026-02-14",
        days: 7,
        summary: {
          checkinCount: 0,
          alertCount: 0,
          averages: {
            energy: null,
            stress: null,
            social: null,
            driftIndex: null
          },
          driftLevel: "low",
          hasEnoughData: false
        },
        highlights: ["No check-ins were recorded this week."],
        suggestions: ["Keep your next check-in consistent to maintain trend quality."]
      }
    });

    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText("Not enough data yet to derive stable trends.")).toBeInTheDocument();
    });
  });
});

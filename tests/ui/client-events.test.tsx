import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckinPage from "@/app/checkin/page";
import SettingsPage from "@/app/settings/page";
import WeeklyInsightsPage from "@/app/insights/page";

const trackClientEvent = vi.fn();
let mockPathname = "/checkin";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname
}));

vi.mock("@/lib/metrics/client-events", () => ({
  trackClientEvent: (...args: unknown[]) => trackClientEvent(...args)
}));

describe("client events", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    trackClientEvent.mockReset();
    mockPathname = "/checkin";
  });

  it("tracks checkin_submitted on successful check-in", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ session: { userId: "u1" } }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ checkin: { id: "c1" } }), {
          status: 201,
          headers: { "content-type": "application/json" }
        })
      );

    render(<CheckinPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit Check-in" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Energy (1-5)"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Stress (1-5)"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Social (1-5)"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Check-in" }));

    await waitFor(() => {
      expect(trackClientEvent).toHaveBeenCalledWith("checkin_submitted");
    });
  });

  it("tracks settings_saved on successful save", async () => {
    mockPathname = "/settings";
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
            settings: { reminderTime: "08:30", timezone: "UTC", enabled: true }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save Settings" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(trackClientEvent).toHaveBeenCalledWith(
        "settings_saved",
        expect.objectContaining({ timezone: "UTC", enabled: true })
      );
    });
  });

  it("tracks insights_viewed when weekly insights are loaded", async () => {
    mockPathname = "/insights";
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
            weekStart: "2026-02-08",
            weekEnd: "2026-02-14",
            days: 7,
            summary: {
              checkinCount: 2,
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
            highlights: ["Weekly insight summary."],
            suggestions: ["Take one reset block.", "Keep routine steady."]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    render(<WeeklyInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Window:/)).toBeInTheDocument();
    });

    expect(trackClientEvent).toHaveBeenCalledWith(
      "insights_viewed",
      expect.objectContaining({ suggestionCount: 2 })
    );
  });
});

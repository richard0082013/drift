import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TrendsPage from "@/app/trends/page";
import AlertsPage from "@/app/alerts/page";
import { TrendChart } from "@/components/trend-chart";

describe("trends and alerts UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("supports 7/30 day switch", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValue(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      );

    render(<TrendsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "7 days" })).toBeInTheDocument();
    });

    const btn7 = screen.getByRole("button", { name: "7 days" });
    const btn30 = screen.getByRole("button", { name: "30 days" });

    fireEvent.click(btn30);
    expect(btn30).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(btn7);
    await waitFor(() => {
      expect(btn7).toHaveAttribute("aria-pressed", "true");
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/trends\?days=(7|30)$/),
      expect.any(Object)
    );
  });

  it("shows reason and action on alerts page", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: "a1",
                reason: "Energy has trended down over recent check-ins.",
                action: "Try a short reset today."
              }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Energy has trended down/)).toBeInTheDocument();
      expect(screen.getByText(/Try a short reset today/)).toBeInTheDocument();
    });
  });

  it("renders trends from series payload", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            window: 7,
            series: {
              dates: ["2026-02-12", "2026-02-13"],
              energy: [4, 3],
              stress: [2, 3],
              social: [5, 4]
            }
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    render(<TrendsPage />);

    await waitFor(() => {
      expect(screen.getByText(/2026-02-12 E:4 S:2 C:5/)).toBeInTheDocument();
      expect(screen.getByText(/2026-02-13 E:3 S:3 C:4/)).toBeInTheDocument();
    });
  });

  it("shows empty and error states clearly", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "bad" }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "bad" }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      );

    render(
      <TrendChart
        period={7}
        data={[]}
        loading={false}
        error={null}
        onPeriodChange={() => undefined}
      />
    );
    expect(screen.getByText("No trend data yet.")).toBeInTheDocument();

    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load alerts.")).toBeInTheDocument();
    });
  });
});

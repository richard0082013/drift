import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "@/lib/auth/session";

const { checkinFindManyMock, driftFindManyMock, alertFindManyMock } = vi.hoisted(() => ({
  checkinFindManyMock: vi.fn(),
  driftFindManyMock: vi.fn(),
  alertFindManyMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    dailyCheckin: { findMany: checkinFindManyMock },
    driftScore: { findMany: driftFindManyMock },
    alert: { findMany: alertFindManyMock }
  }
}));

import { GET } from "@/app/api/insights/weekly/route";

describe("GET /api/insights/weekly", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T12:00:00.000Z"));
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    const response = await GET(new Request("http://localhost/api/insights/weekly"));

    expect(response.status).toBe(401);
  });

  it("returns weekly summary and suggestions", async () => {
    checkinFindManyMock.mockResolvedValue([
      { date: new Date("2026-02-08T00:00:00.000Z"), energy: 2, stress: 4, social: 2 },
      { date: new Date("2026-02-09T00:00:00.000Z"), energy: 3, stress: 4, social: 3 },
      { date: new Date("2026-02-10T00:00:00.000Z"), energy: 2, stress: 5, social: 2 }
    ]);
    driftFindManyMock.mockResolvedValue([
      { date: new Date("2026-02-09T00:00:00.000Z"), driftIndex: 0.8, reasonsJson: ["energy"] }
    ]);
    alertFindManyMock.mockResolvedValue([{ date: new Date("2026-02-10T00:00:00.000Z"), level: "high" }]);

    const response = await GET(
      new Request("http://localhost/api/insights/weekly", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.weekStart).toBe("2026-02-08");
    expect(body.weekEnd).toBe("2026-02-14");
    expect(body.summary).toEqual(
      expect.objectContaining({
        checkinCount: 3,
        alertCount: 1,
        driftLevel: "high",
        hasEnoughData: true
      })
    );
    expect(body.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(body.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("returns stable empty-state contract", async () => {
    checkinFindManyMock.mockResolvedValue([]);
    driftFindManyMock.mockResolvedValue([]);
    alertFindManyMock.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost/api/insights/weekly", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({
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
    });
    expect(body.highlights[0]).toContain("No check-ins");
    expect(body.suggestions.length).toBeGreaterThanOrEqual(2);
  });
});

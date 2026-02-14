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

describe("weekly insights api contract", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T12:00:00.000Z"));
    vi.clearAllMocks();

    checkinFindManyMock.mockResolvedValue([
      { date: new Date("2026-02-10T00:00:00.000Z"), energy: 4, stress: 2, social: 4 }
    ]);
    driftFindManyMock.mockResolvedValue([
      { date: new Date("2026-02-10T00:00:00.000Z"), driftIndex: 0.3, reasonsJson: [] }
    ]);
    alertFindManyMock.mockResolvedValue([]);
  });

  it("rejects invalid days input", async () => {
    const response = await GET(
      new Request("http://localhost/api/insights/weekly?days=0", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns fixed contract fields for FE integration", async () => {
    const response = await GET(
      new Request("http://localhost/api/insights/weekly?days=7", {
        headers: { cookie: `drift_session=${createSessionToken("u1")}` }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      weekStart: "2026-02-08",
      weekEnd: "2026-02-14",
      days: 7,
      summary: {
        checkinCount: 1,
        alertCount: 0,
        averages: {
          energy: 4,
          stress: 2,
          social: 4,
          driftIndex: 0.3
        },
        driftLevel: "low",
        hasEnoughData: false
      },
      highlights: expect.any(Array),
      suggestions: expect.any(Array)
    });
    expect(body.highlights.length).toBeGreaterThanOrEqual(1);
    expect(body.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(body.suggestions.length).toBeLessThanOrEqual(3);
  });
});

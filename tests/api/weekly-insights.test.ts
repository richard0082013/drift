import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUserIdMock, findManyMock } = vi.hoisted(() => ({
  getSessionUserIdMock: vi.fn(),
  findManyMock: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionUserId: getSessionUserIdMock,
  unauthorizedResponse: () =>
    Response.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required."
        }
      },
      { status: 401 }
    )
}));

vi.mock("@/lib/db", () => ({
  db: {
    dailyCheckin: {
      findMany: findManyMock
    }
  }
}));

import { GET } from "@/app/api/insights/weekly/route";

describe("GET /api/insights/weekly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    getSessionUserIdMock.mockReturnValue(null);

    const response = await GET(new Request("http://localhost/api/insights/weekly"));
    expect(response.status).toBe(401);
  });

  it("returns weekly summary and 2-3 recommendations", async () => {
    getSessionUserIdMock.mockReturnValue("u1");
    findManyMock.mockResolvedValue([
      { date: new Date("2026-02-10"), energy: 4, stress: 3, social: 3 },
      { date: new Date("2026-02-11"), energy: 3, stress: 4, social: 2 },
      { date: new Date("2026-02-12"), energy: 2, stress: 4, social: 2 },
      { date: new Date("2026-02-13"), energy: 2, stress: 5, social: 1 }
    ]);

    const response = await GET(new Request("http://localhost/api/insights/weekly"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1" })
      })
    );
    expect(body.summary.checkinCount).toBe(4);
    expect(body.summary.trend).toMatch(/improving|stable|worsening/);
    expect(Array.isArray(body.recommendations)).toBe(true);
    expect(body.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(body.recommendations.length).toBeLessThanOrEqual(3);
  });

  it("returns meaningful empty-state insights when no data in window", async () => {
    getSessionUserIdMock.mockReturnValue("u1");
    findManyMock.mockResolvedValue([]);

    const response = await GET(new Request("http://localhost/api/insights/weekly"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary.checkinCount).toBe(0);
    expect(body.summary.trend).toBe("stable");
    expect(body.recommendations.length).toBeGreaterThanOrEqual(2);
  });
});
